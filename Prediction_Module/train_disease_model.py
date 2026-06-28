import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, Input
from tensorflow.keras.models import Model
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, BackupAndRestore
import json
import os

# Set paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(os.path.dirname(BASE_DIR), "Disease_Detection", "Plant Village Dataset")
TRAIN_DIR = os.path.join(DATASET_DIR, "Train")
VAL_DIR = os.path.join(DATASET_DIR, "Val")

MODEL_SAVE_PATH = os.path.join(BASE_DIR, "models", "disease_model.keras")
BACKUP_DIR = os.path.join(BASE_DIR, "models", "backup")
CLASSES_SAVE_PATH = os.path.join(BASE_DIR, "models", "disease_classes.json")

# Hyperparameters
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 15 # More epochs for better accuracy

def train_model():
    print("Loading dataset...")
    # Advanced Data Augmentation for Better Generalization
    train_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        vertical_flip=True,
        fill_mode='nearest',
        brightness_range=[0.8, 1.2]
    )
    
    val_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

    train_generator = train_datagen.flow_from_directory(
        TRAIN_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical'
    )

    val_generator = val_datagen.flow_from_directory(
        VAL_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical'
    )

    classes = list(train_generator.class_indices.keys())
    os.makedirs(os.path.dirname(CLASSES_SAVE_PATH), exist_ok=True)
    with open(CLASSES_SAVE_PATH, 'w') as f:
        json.dump(classes, f)
    print(f"Found {len(classes)} classes. Saved to {CLASSES_SAVE_PATH}")

    if os.path.exists(MODEL_SAVE_PATH):
        print(f"Resuming training! Found existing model at {MODEL_SAVE_PATH}")
        model = tf.keras.models.load_model(MODEL_SAVE_PATH)
        
        # Locate the base MobileNetV2 layer for fine-tuning reference
        for layer in model.layers:
            if layer.name == 'mobilenetv2_1.00_224' or isinstance(layer, Model):
                base_model = layer
                break
    else:
        print("Building MobileNetV2 Transfer Learning Model...")
        # Base model with pre-trained weights
        base_model = MobileNetV2(
            weights='imagenet', 
            include_top=False, 
            input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3)
        )
        
        # Freeze the base model layers initially
        base_model.trainable = False
        
        # Custom head
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dense(512, activation='relu')(x)
        x = Dropout(0.5)(x)
        predictions = Dense(len(classes), activation='softmax')(x)
        
        model = Model(inputs=base_model.input, outputs=predictions)

        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001), 
            loss='categorical_crossentropy', 
            metrics=['accuracy']
        )

    # Callbacks for better training
    checkpoint = ModelCheckpoint(
        MODEL_SAVE_PATH,
        monitor='val_accuracy',
        save_best_only=True,
        mode='max',
        verbose=1
    )
    
    early_stopping = EarlyStopping(
        monitor='val_accuracy',
        patience=5,
        restore_best_weights=True,
        verbose=1
    )
    
    reduce_lr = ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.2,
        patience=3,
        min_lr=1e-6,
        verbose=1
    )
    
    backup_restore = BackupAndRestore(
        backup_dir=BACKUP_DIR,
        save_freq="epoch"
    )

    print(f"Starting training for {EPOCHS} epochs...")
    history = model.fit(
        train_generator,
        epochs=EPOCHS,
        steps_per_epoch=150, # Greatly speeds up epoch completion (runs ~1 hour)
        validation_data=val_generator,
        validation_steps=50,
        callbacks=[checkpoint, early_stopping, reduce_lr, backup_restore]
    )
    
    # Optional: Fine-tuning step (unfreeze last 30 layers)
    print("Base training complete. Starting fine-tuning...")
    base_model.trainable = True
    # Freeze all layers except the last 30
    for layer in base_model.layers[:-30]:
        layer.trainable = False
        
    # Re-freeze all BatchNormalization layers to prevent moving mean/variance from updating
    for layer in base_model.layers:
        if isinstance(layer, tf.keras.layers.BatchNormalization):
            layer.trainable = False
        
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5), # Very low learning rate
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    model.fit(
        train_generator,
        epochs=EPOCHS + 5, # 5 more epochs of fine-tuning (start from offset)
        initial_epoch=EPOCHS,
        steps_per_epoch=150,
        validation_data=val_generator,
        validation_steps=50,
        callbacks=[checkpoint, early_stopping, reduce_lr, backup_restore]
    )
    
    print(f"Final model saved to {MODEL_SAVE_PATH}")

if __name__ == "__main__":
    train_model()
