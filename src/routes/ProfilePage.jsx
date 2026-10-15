import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema } from '../schemas/authSchemas.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'

export default function ProfilePage() {
  const { user, updateProfile, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
      email: user?.email || '',
    },
  })

  const onProfileUpdate = async (data) => {
    try {
      await updateProfile({
        email: data.email,
        data: { full_name: data.fullName },
      })
      toast('Profile updated', 'success')
    } catch (err) {
      toast(err.message || 'Could not update profile', 'error')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="profile-page">
      <h1 className="profile-page__title">Profile Settings</h1>

      <div className="profile-card">
        <div className="profile-card__avatar">
          {(user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="profile-card__info">
          <h2>{user?.user_metadata?.full_name || 'User'}</h2>
          <p>{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onProfileUpdate)} className="profile-form">
        <h3 className="profile-form__title">Edit Profile</h3>
        <Input
          label="Full Name"
          name="fullName"
          register={register}
          error={errors.fullName?.message}
        />
        <Input
          label="Email"
          type="email"
          name="email"
          register={register}
          error={errors.email?.message}
        />
        <Button type="submit" loading={isSubmitting}>Save Changes</Button>
      </form>

      <div className="profile-actions">
        <Button variant="secondary" onClick={handleSignOut}>Sign Out</Button>
        <Button variant="ghost" className="btn--danger" onClick={() => setConfirmDelete(true)}>
          Delete Account
        </Button>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete Account?">
        <p className="modal-text">
          This will permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="primary" className="btn--danger" onClick={async () => {
            await signOut()
            navigate('/')
          }}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
