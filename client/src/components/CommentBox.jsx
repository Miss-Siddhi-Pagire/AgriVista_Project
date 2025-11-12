import { useState, useRef, useEffect } from "react";
import cn from "classnames";
import Cookies from "js-cookie";
import { useTranslation } from 'react-i18next';
import "../assets/Comment.css";

const creatorname = Cookies.get("username");
const INITIAL_HEIGHT = 46;

const CommentBox = ({ onCommentSubmit, type, heading, postId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentValue, setCommentValue] = useState("");
  const { t } = useTranslation();

  const outerHeight = useRef(INITIAL_HEIGHT);
  const textRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!textRef.current) return;
    textRef.current.style.height = "auto";
    textRef.current.style.height = textRef.current.scrollHeight + "px";
  }, [commentValue]);

  const onExpand = () => {
    if (!isExpanded) {
      outerHeight.current = containerRef.current.scrollHeight;
      setIsExpanded(true);
    }
  };

  const onChange = (e) => setCommentValue(e.target.value);
  const onClose = () => { setCommentValue(""); setIsExpanded(false); };

  const onSubmit = async (e) => {
    e.preventDefault();
    const commentData = {
      postId,
      content: commentValue,
      creatorname,
      creatorId: Cookies.get("id"),
      createdAt: new Date(),
    };

    const postData = {
      creatorname,
      creatorId: Cookies.get("id"),
      heading,
      content: commentValue
    };

    if (type === "post") {
      onCommentSubmit(postData);
    } else if (type === "comment") {
      onCommentSubmit(commentData);
    }

    setCommentValue("");
    setIsExpanded(false);
  };

  return (
    <form
      onSubmit={onSubmit}
      ref={containerRef}
      className={cn("comment-box", {
        expanded: isExpanded,
        collapsed: !isExpanded,
        modified: commentValue.length > 0,
      })}
      style={{ minHeight: isExpanded ? outerHeight.current : INITIAL_HEIGHT }}
    >
      <div className="header">
        <div className="user">
          <img
            src="https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg"
            className="rounded-circle"
            alt="User"
            style={{ width: "40px", height: "40px" }}
          />
          <span>{creatorname}</span>
        </div>
      </div>
      <label className="commentLabel" htmlFor="comment">{t('CThoughts')}</label>
      <textarea
        ref={textRef}
        onClick={onExpand}
        onFocus={onExpand}
        onChange={onChange}
        className="comment-field"
        placeholder={t('CThoughts')}
        value={commentValue}
        name="comment"
        id="comment"
        required
      />
      <div className="actions">
        <button type="submit" disabled={commentValue.length < 1}>{t('CRespond')}</button>
        <button type="button" className="cancel" onClick={onClose}>{t('CCancel')}</button>
      </div>
    </form>
  );
};

export default CommentBox;
