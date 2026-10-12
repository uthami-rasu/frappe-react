import { toast } from 'sonner'
import { useState, type FormEvent } from 'react'
import { useChangePasswordMutation, useUpdateProfileMutation } from '../../features/api/storeApi'
import type { SessionUser } from '../../types/account'

const labelClass = 'block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1'
const buttonClass = 'bg-[#D9B27C] hover:bg-[#c9a068] text-white font-bold px-8 py-3 rounded-lg transition-colors shadow-md text-sm disabled:cursor-wait disabled:opacity-70'
const errorText = (error: unknown) => (typeof error === 'string' ? error : 'Please try again.')

export function AccountDetails({ user }: { user: SessionUser }) {
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation()
  const [changePassword, { isLoading: isChanging }] = useChangePasswordMutation()
  const [profile, setProfile] = useState({ first_name: user.firstName, last_name: user.lastName, phone: user.phone })

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await updateProfile(profile).unwrap()
      toast.success('Account details updated!', { description: 'Your profile has been saved.' })
    } catch (error) {
      toast.error('Could not save your details', { description: errorText(error) })
    }
  }

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const newPassword = String(form.get('new_password'))
    if (newPassword !== String(form.get('repeat_password'))) {
      toast.error('New passwords do not match')
      return
    }
    try {
      await changePassword({ old_password: String(form.get('old_password')), new_password: newPassword }).unwrap()
      formElement.reset()
      toast.success('Password updated')
    } catch (error) {
      toast.error('Could not change your password', { description: errorText(error) })
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={saveProfile} className="bg-white/80 backdrop-blur-sm border border-[#e2ded5] rounded-xl p-6 md:p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#173f32] mb-6">Account Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass} htmlFor="profile-first">First name *</label>
            <input id="profile-first" required value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} className="account-input" autoComplete="given-name" />
          </div>
          <div>
            <label className={labelClass} htmlFor="profile-last">Last name</label>
            <input id="profile-last" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} className="account-input" autoComplete="family-name" />
          </div>
          <div>
            <label className={labelClass} htmlFor="profile-phone">Phone</label>
            <input id="profile-phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="account-input" autoComplete="tel" />
          </div>
          <div>
            <label className={labelClass} htmlFor="profile-email">Email</label>
            <input id="profile-email" type="email" value={user.email} readOnly className="account-input cursor-not-allowed bg-stone-50 text-stone-500" />
            <p className="text-xs text-stone-500 italic mt-1.5">Your email is your login and can't be changed here.</p>
          </div>
        </div>
        <button type="submit" className={`${buttonClass} mt-6`} disabled={isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</button>
      </form>

      <form onSubmit={savePassword} className="bg-white/80 backdrop-blur-sm border border-[#e2ded5] rounded-xl p-6 md:p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#173f32] mb-6">Password</h2>
        <div className="space-y-4 max-w-xl">
          <div>
            <label className={labelClass} htmlFor="old-password">Current password</label>
            <input id="old-password" name="old_password" type="password" required autoComplete="current-password" className="account-input" />
          </div>
          <div>
            <label className={labelClass} htmlFor="new-password">New password</label>
            <input id="new-password" name="new_password" type="password" required minLength={8} autoComplete="new-password" className="account-input" />
          </div>
          <div>
            <label className={labelClass} htmlFor="repeat-password">Repeat new password</label>
            <input id="repeat-password" name="repeat_password" type="password" required minLength={8} autoComplete="new-password" className="account-input" />
          </div>
        </div>
        <button type="submit" className={`${buttonClass} mt-6`} disabled={isChanging}>{isChanging ? 'Updating…' : 'Change password'}</button>
      </form>
    </div>
  )
}
