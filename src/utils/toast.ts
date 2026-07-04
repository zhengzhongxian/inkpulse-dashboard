const toastStyles = `
  .custom-toast-container {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }
  .custom-toast {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 340px;
    padding: 12px 16px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 14px;
    pointer-events: auto;
    transform: translateY(-15px) scale(0.95);
    transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.1), opacity 0.15s;
    opacity: 0;
  }
  .custom-toast.show {
    transform: translateY(0) scale(1);
    opacity: 1;
  }

  /* Success - light green background, black text, black circle icon */
  .custom-toast.success {
    background-color: #C6F6D5;
    color: #1A202C;
    border: 1px solid #A3E635;
  }
  .custom-toast.success .custom-toast-icon-box {
    background-color: #1A202C;
    color: #ffffff;
  }
  .custom-toast.success .custom-toast-description {
    color: #2D3748;
  }

  /* Error - light red background, black text, black circle icon */
  .custom-toast.error {
    background-color: #FED7D7;
    color: #1A202C;
    border: 1px solid #FEB2B2;
  }
  .custom-toast.error .custom-toast-icon-box {
    background-color: #1A202C;
    color: #ffffff;
  }
  .custom-toast.error .custom-toast-description {
    color: #2D3748;
  }

  /* Warning - light orange background, black text, black circle icon */
  .custom-toast.warning {
    background-color: #FEEBC8;
    color: #1A202C;
    border: 1px solid #FBD38D;
  }
  .custom-toast.warning .custom-toast-icon-box {
    background-color: #1A202C;
    color: #ffffff;
  }
  .custom-toast.warning .custom-toast-description {
    color: #2D3748;
  }

  /* Info - light blue background, black text, black circle icon */
  .custom-toast.info {
    background-color: #EBF8FF;
    color: #1A202C;
    border: 1px solid #BEE3F8;
  }
  .custom-toast.info .custom-toast-icon-box {
    background-color: #1A202C;
    color: #ffffff;
  }
  .custom-toast.info .custom-toast-description {
    color: #2D3748;
  }

  .custom-toast-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .custom-toast-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .custom-toast-title {
    font-weight: 600;
    font-size: 14px;
    line-height: 1.2;
    text-align: left;
  }
  .custom-toast-description {
    font-size: 12.5px;
    line-height: 1.3;
    text-align: left;
  }
  .custom-toast-close {
    background: none;
    border: none;
    color: rgba(0, 0, 0, 0.45);
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 0;
    margin-top: -1px;
    transition: color 0.1s;
    outline: none;
  }
  .custom-toast-close:hover {
    color: #000000;
  }
`;

if (typeof document !== 'undefined') {
  const styleId = 'custom-toast-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.innerText = toastStyles;
    document.head.appendChild(styleSheet);
  }
}

function createContainer(): HTMLDivElement {
  let container = document.querySelector('.custom-toast-container') as HTMLDivElement;
  if (!container) {
    container = document.createElement('div');
    container.className = 'custom-toast-container';
    document.body.appendChild(container);
  }
  return container;
}

export const showToast = (title: string, description: string = '', type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  const container = createContainer();
  const toastElement = document.createElement('div');
  toastElement.className = `custom-toast ${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  } else if (type === 'warning') {
    iconSvg = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else if (type === 'info') {
    iconSvg = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toastElement.innerHTML = `
    <div class="custom-toast-icon-box">${iconSvg}</div>
    <div class="custom-toast-content">
      <div class="custom-toast-title">${title}</div>
      ${description ? `<div class="custom-toast-description">${description}</div>` : ''}
    </div>
    <button class="custom-toast-close">&times;</button>
  `;

  container.appendChild(toastElement);

  setTimeout(() => {
    toastElement.classList.add('show');
  }, 10);

  const removeToast = () => {
    toastElement.classList.remove('show');
    const handleTransitionEnd = () => {
      toastElement.remove();
      toastElement.removeEventListener('transitionend', handleTransitionEnd);
    };
    toastElement.addEventListener('transitionend', handleTransitionEnd);
  };

  toastElement.querySelector('.custom-toast-close')?.addEventListener('click', removeToast);

  setTimeout(removeToast, 3500);
};

export const toast = {
  success: (title: string, desc: string = '') => showToast(title, desc, 'success'),
  error: (title: string, desc: string = '') => showToast(title, desc, 'error'),
  warning: (title: string, desc: string = '') => showToast(title, desc, 'warning'),
  info: (title: string, desc: string = '') => showToast(title, desc, 'info'),
};
