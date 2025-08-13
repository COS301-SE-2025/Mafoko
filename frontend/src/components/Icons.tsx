import React from 'react';

const iconStyle: React.CSSProperties = {
  display: 'inline-block',
  width: '24px',
  height: '24px',
  strokeWidth: 1.5,
  fill: 'none',
  stroke: 'currentColor',
};

export const BackArrowIcon = () => (
  <svg style={iconStyle} viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

export const UpArrowIcon = () => (
  <svg style={iconStyle} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);

export const DownArrowIcon = () => (
  <svg style={iconStyle} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export const ShareIcon = () => (
  <svg style={iconStyle} viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8m-4-6l-4-4m0 0L8 6m4-4v12"
    />
  </svg>
);

export const DotsIcon = () => (
  <svg style={iconStyle} viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 12h.01M12 12h.01M19 12h.01"
    />
  </svg>
);

export const BookmarkIcon = () => (
  <svg
    style={{ ...iconStyle, fill: 'currentColor', stroke: 'none' }}
    viewBox="0 0 24 24"
  >
    <path d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z" />
  </svg>
);

export const SendIcon = () => (
  <svg style={iconStyle} viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);

export const SuggestEditArrowIcon = () => (
  <svg
    style={{ ...iconStyle, width: '16px', height: '16px' }}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 5l7 7m0 0l-7 7m7-7H3"
    />
  </svg>
);

export const CommentBubbleIcon = () => (
  <svg style={iconStyle} viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

export const EditIcon = () => (
  <svg style={iconStyle} viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-7-7l4-4m-4 4L9 15m7-7l-4 4m4-4l-3-3m0 0l3 3m-3-3l-7 7"
    />
  </svg>
);

export const DeleteIcon = () => (
  <svg style={iconStyle} viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
