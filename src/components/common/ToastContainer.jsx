import { CheckCircle2, AlertCircle, X, Sparkles } from '../icons/Icons.jsx'

export default function ToastContainer({ toasts, onClose }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="qm-toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => {
        const icon =
          toast.type === 'success' ? (
            <CheckCircle2 className="qm-toast__icon qm-toast__icon--success" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="qm-toast__icon qm-toast__icon--error" />
          ) : toast.type === 'warning' ? (
            <AlertCircle className="qm-toast__icon qm-toast__icon--warning" />
          ) : (
            <Sparkles className="qm-toast__icon qm-toast__icon--info" />
          )

        return (
          <div key={toast.id} className={`qm-toast qm-toast--${toast.type}`} role="alert">
            <div className="qm-toast__body">
              {icon}
              <span className="qm-toast__message">{toast.message}</span>
            </div>
            <button
              type="button"
              className="qm-toast__close"
              onClick={() => onClose(toast.id)}
              aria-label="Close notification"
            >
              <X />
            </button>
          </div>
        )
      })}
    </div>
  )
}
