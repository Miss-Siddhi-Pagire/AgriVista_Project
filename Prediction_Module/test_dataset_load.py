import pandas as pd
import os
import psutil
import gc
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def print_memory(tag=""):
    process = psutil.Process(os.getpid())
    mem_info = process.memory_info()
    print(f"[{tag}] Memory Usage: {mem_info.rss / 1024 / 1024:.2f} MB")

DATASET_PATH = os.path.join(BASE_DIR, "datasets/Indian_crop_production_yield_dataset.csv")

print_memory("Start")

try:
    if os.path.exists(DATASET_PATH):
        # OPTIMIZED LOAD: Only necessary columns + Dtypes
        use_cols = ['State_Name', 'District_Name', 'Season', 'Crop']
        
        dtype_spec = {
            'State_Name': 'category',
            'District_Name': 'category',
            'Season': 'category',
            'Crop': 'category'
        }
        
        print("Reading CSV...")
        df = pd.read_csv(DATASET_PATH, usecols=use_cols, dtype=dtype_spec)
        print(f"Dataset Loaded. Rows: {len(df)}")
        print_memory("Post-Read")

        print("Cleaning Categories...")
        for col in use_cols:
            if hasattr(df[col], 'cat'):
                # Get current categories
                cats = df[col].cat.categories
                new_cats = [str(x).strip().lower() for x in cats]
                
                # Check for duplicates in new_cats
                if len(new_cats) != len(set(new_cats)):
                    # Duplicates found! Need to collapse.
                    mapper = dict(zip(cats, new_cats))
                    df[col] = df[col].map(mapper).astype('category')
                else:
                    # No duplicates, safe to rename
                    df[col] = df[col].cat.rename_categories(new_cats)
        print("Categories Cleaned.")
        
        print("Generating Caches...")
        CACHED_SEASONS = sorted([s.title() for s in df['Season'].cat.categories.tolist() if s and str(s) != 'nan'])
        CACHED_STATES = sorted([s.title() for s in df['State_Name'].cat.categories.tolist() if s and str(s) != 'nan'])
        
        CACHED_LOCATIONS = {}
        grouped = df.groupby('State_Name', observed=True)['District_Name'].unique()
        
        for state, districts in grouped.items():
            if str(state) == 'nan': continue
            display_state = state.title()
            display_districts = sorted([d.title() for d in districts.tolist() if d and str(d) != 'nan'])
            CACHED_LOCATIONS[display_state] = display_districts
            
        print("Caches Generated.")
        print_memory("End")
        gc.collect()

    else:
        print("Dataset not found!")
        sys.exit(1)

except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)
