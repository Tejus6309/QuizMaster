import { useState, useRef, useCallback } from 'react'
import { Check, X } from '../icons/Icons.jsx'

const MAX_SIZE = 10 * 1024 * 1024
const ACCEPTED = ['.pdf', '.docx', '.txt', '.md']

export default function FileDropzone({ onFileSelected, error }) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [localError, setLocalError] = useState('')
  const inputRef = useRef(null)

  const validateFile = useCallback((f) => {
    if (f.size > MAX_SIZE) return 'File too large (max 10 MB)'
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED.includes(ext)) return `Unsupported type. Use: ${ACCEPTED.join(', ')}`
    return ''
  }, [])

  const handleFile = useCallback(
    (f) => {
      const err = validateFile(f)
      if (err) {
        setLocalError(err)
        return
      }
      setLocalError('')
      setFile(f)
      onFileSelected(f)
    },
    [validateFile, onFileSelected]
  )

  return (
    <div className="dropzone-wrap">
      <div
        className={`dropzone ${dragging ? 'dropzone--active' : ''} ${file ? 'dropzone--has-file' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="dropzone__input"
          onChange={(e) => {
            if (e.target.files[0]) handleFile(e.target.files[0])
          }}
        />
        {file ? (
          <div className="dropzone__file-info">
            <span className="dropzone__file-icon">📄</span>
            <div>
              <p className="dropzone__file-name">{file.name}</p>
              <p className="dropzone__file-size">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              type="button"
              className="dropzone__remove"
              onClick={(e) => {
                e.stopPropagation()
                setFile(null)
                onFileSelected(null)
              }}
            >
              <X />
            </button>
          </div>
        ) : (
          <div className="dropzone__placeholder">
            <span className="dropzone__icon">📁</span>
            <p className="dropzone__text">Drag & drop a file here, or click to browse</p>
            <p className="dropzone__hint">PDF, DOCX, TXT, MD (max 10 MB)</p>
          </div>
        )}
      </div>
      {(localError || error) && <p className="ui-field__error">{localError || error}</p>}
    </div>
  )
}
