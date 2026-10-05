'use client'

import { useState } from 'react'
import { saveStudioSettings } from '@/app/actions/admin'
import toast from 'react-hot-toast'

export default function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('branding')
  const [qrUrl, setQrUrl] = useState(initialSettings?.qrCodeUrl || '')
  const [aboutImage1, setAboutImage1] = useState(initialSettings?.aboutImage1 || '')
  const [aboutImage2, setAboutImage2] = useState(initialSettings?.aboutImage2 || '')
  const [aboutImage3, setAboutImage3] = useState(initialSettings?.aboutImage3 || '')
  const [heroImage, setHeroImage] = useState(initialSettings?.heroImage || '')
  const [loginImage, setLoginImage] = useState(initialSettings?.loginImage || '')
  const defaultTermsEn = `<h2>1. Introduction</h2>
<p>Welcome to Anya Pilates Studio. By booking a class, purchasing a package, or using our studio facilities, you agree to comply with and be bound by the following Terms and Conditions.</p>

<h2>2. Booking & Cancellation Policy</h2>
<p>All classes must be booked in advance through our online platform. We operate a strict cancellation policy to ensure fairness to all members:</p>
<ul>
<li>Cancellations must be made at least <strong>12 hours</strong> prior to the class start time.</li>
<li>Late cancellations or no-shows will result in the forfeiture of one class credit.</li>
<li>If you arrive more than 10 minutes late, you may be denied entry.</li>
</ul>

<h2>3. Packages & Payments</h2>
<p>All purchases are final. Class packages are non-refundable and non-transferable.</p>
<ul>
<li>Packages expire exactly on their stated expiration date.</li>
<li>Trial packages are strictly limited to one per person.</li>
</ul>

<h2>4. Health, Safety & Liability</h2>
<p>Pilates involves physical exertion. By participating, you acknowledge and assume all risks.</p>
<ul>
<li>You must inform your instructor of any injuries or medical conditions.</li>
<li>Grip socks are strictly required for all classes.</li>
</ul>`;
  const [termsContentEn, setTermsContentEn] = useState(initialSettings?.termsContentEn ?? defaultTermsEn)
  const [termsContentTh, setTermsContentTh] = useState(initialSettings?.termsContentTh ?? '<h2>ข้อตกลงและเงื่อนไข</h2>\n<p>กรุณาใส่ข้อตกลงและเงื่อนไขของคุณที่นี่...</p>')
  const defaultPrivacyEn = `<h2>1. Data Collection</h2>
<p>We collect personal information such as your name, email address, phone number, and emergency contact details when you register.</p>

<h2>2. Use of Information</h2>
<p>Your data is used strictly for managing your bookings, processing payments, and contacting you regarding studio updates or class changes.</p>

<h2>3. Data Protection</h2>
<p>We implement industry-standard security measures to protect your personal information. We do not sell or share your data with third parties for marketing purposes.</p>`;
  const [policyContentEn, setPolicyContentEn] = useState(initialSettings?.policyContentEn ?? defaultPrivacyEn)
  const [policyContentTh, setPolicyContentTh] = useState(initialSettings?.policyContentTh ?? '<h2>นโยบายความเป็นส่วนตัว</h2>\n<p>กรุณาใส่นโยบายความเป็นส่วนตัวของคุณที่นี่...</p>')
  
  const [footer, setFooter] = useState({
    contactEmail: initialSettings?.contactEmail || '',
    contactPhone: initialSettings?.contactPhone || '',
    contactAddress: initialSettings?.contactAddress || '',
    hoursWeekday: initialSettings?.hoursWeekday || '',
    hoursSaturday: initialSettings?.hoursSaturday || '',
    hoursSunday: initialSettings?.hoursSunday || '',
    instagramUrl: initialSettings?.instagramUrl || '',
    facebookUrl: initialSettings?.facebookUrl || '',
    lineUrl: initialSettings?.lineUrl || '',
    whatsappUrl: initialSettings?.whatsappUrl || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFooter({ ...footer, [e.target.name]: e.target.value })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_SIZE = 1200 // Slightly larger for about images
          let width = img.width
          let height = img.height
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round((height * MAX_SIZE) / width)
              width = MAX_SIZE
            } else {
              width = Math.round((width * MAX_SIZE) / height)
              height = MAX_SIZE
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          setter(canvas.toDataURL('image/jpeg', 0.85)) // 85% quality to save space
        }
        img.src = reader.result
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await saveStudioSettings({
        qrCodeUrl: qrUrl,
        aboutImage1,
        aboutImage2,
        aboutImage3,
        heroImage,
        ...footer
      })
      toast.success('Settings saved successfully.')
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings')
    }
    setLoading(false)
  }

  const renderImageUploader = (label: string, value: string, setter: (val: string) => void, aspectClass: string) => (
    <div>
      <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">{label}</label>
      {value ? (
        <div className="mb-4">
          <img src={value} alt={label} className={`object-cover border border-black/5 rounded-xl bg-white shadow-sm ${aspectClass}`} />
          <button 
            onClick={() => setter('')} 
            className="text-xs text-red-600 mt-2 hover:underline inline-block"
          >
            Remove Image
          </button>
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center border-2 border-dashed border-black/10 rounded-xl hover:bg-black/5 transition-colors relative cursor-pointer ${aspectClass}`}>
          <span className="text-xs text-[var(--foreground-muted)]">Click to upload</span>
          <span className="text-[10px] text-black/30 mt-1">JPEG/PNG</span>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setter)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Tabs Header */}
      <div className="flex flex-wrap gap-2 border-b border-black/10 pb-4">
        {[
          { id: 'branding', label: 'Branding & Images' },
          { id: 'legal', label: 'Legal & Policies' },
          { id: 'contact', label: 'Footer & Contact' },
          { id: 'payment', label: 'Payment & Misc' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs tracking-widest uppercase rounded-full transition-colors ${
              activeTab === tab.id 
                ? 'bg-[var(--accent)] text-white' 
                : 'bg-black/5 text-[var(--foreground-muted)] hover:bg-black/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {/* TAB: BRANDING */}
        {activeTab === 'branding' && (
          <div className="space-y-12">
            <div>
              <h2 className="text-xl font-serif text-[var(--foreground)] border-b border-black/5 pb-2 mb-6">Frontpage Hero Image</h2>
              <p className="text-sm text-[var(--foreground-muted)] mb-6">Upload a stunning background image for the very top of your website.</p>
              {renderImageUploader("Hero Background Image", heroImage, setHeroImage, "w-full h-48 md:h-64 object-cover")}
            </div>

            <div>
              <h2 className="text-xl font-serif text-[var(--foreground)] border-b border-black/5 pb-2 mb-6">Frontpage 'About' Images</h2>
              <p className="text-sm text-[var(--foreground-muted)] mb-6">Upload 3 beautiful photos of your studio interior for the frontpage.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderImageUploader("Main Large Image (Landscape)", aboutImage1, setAboutImage1, "w-full h-48 md:h-64")}
                <div className="space-y-6">
                  {renderImageUploader("Small Image 1 (Landscape)", aboutImage2, setAboutImage2, "w-full h-32 md:h-40")}
                  {renderImageUploader("Small Image 2 (Landscape)", aboutImage3, setAboutImage3, "w-full h-32 md:h-40")}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-serif text-[var(--foreground)] border-b border-black/5 pb-2 mb-6">Login Page Cover</h2>
              <p className="text-sm text-[var(--foreground-muted)] mb-6">Upload the background image displayed on the login and register pages.</p>
              {renderImageUploader("Login Background Image", loginImage, setLoginImage, "w-full h-48 md:h-64 object-cover")}
            </div>
          </div>
        )}

        {/* TAB: LEGAL */}
        {activeTab === 'legal' && (
          <div className="space-y-12">
            <div>
              <h2 className="text-xl font-serif text-[var(--foreground)] border-b border-black/5 pb-2 mb-6">Legal & Policies</h2>
              <p className="text-sm text-[var(--foreground-muted)] mb-6">Enter your studio's legal documents. (Basic HTML formatting like &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt; is supported)</p>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">Terms & Conditions (English)</label>
                  <textarea value={termsContentEn} onChange={e => setTermsContentEn(e.target.value)} className="w-full bg-white/40 border border-black/5 rounded-xl px-4 py-3 min-h-[200px]" placeholder="<h1>Terms</h1><p>...</p>" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">Terms & Conditions (Thai)</label>
                  <textarea value={termsContentTh} onChange={e => setTermsContentTh(e.target.value)} className="w-full bg-white/40 border border-black/5 rounded-xl px-4 py-3 min-h-[200px]" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">Privacy Policy (English)</label>
                  <textarea value={policyContentEn} onChange={e => setPolicyContentEn(e.target.value)} className="w-full bg-white/40 border border-black/5 rounded-xl px-4 py-3 min-h-[200px]" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-widest uppercase mb-2 text-[var(--foreground-muted)]">Privacy Policy (Thai)</label>
                  <textarea value={policyContentTh} onChange={e => setPolicyContentTh(e.target.value)} className="w-full bg-white/40 border border-black/5 rounded-xl px-4 py-3 min-h-[200px]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CONTACT */}
        {activeTab === 'contact' && (
          <div className="space-y-12">
            <div>
              <h2 className="text-xl font-serif text-[var(--foreground)] border-b border-black/5 pb-2 mb-6">Website Footer Content</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)] mb-4">Contact</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Email Address</label>
                      <input name="contactEmail" value={footer.contactEmail} onChange={handleChange} placeholder="hello@anyapilatesstudio.com" className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Phone Number</label>
                      <input name="contactPhone" value={footer.contactPhone} onChange={handleChange} placeholder="+66 80 123 4567" className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Address</label>
                      <textarea name="contactAddress" value={footer.contactAddress} onChange={handleChange} placeholder="Bangkok, Thailand" rows={2} className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)] mb-4">Opening Hours</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Monday - Friday</label>
                      <input name="hoursWeekday" value={footer.hoursWeekday} onChange={handleChange} placeholder="07:00 – 21:00" className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Saturday</label>
                      <input name="hoursSaturday" value={footer.hoursSaturday} onChange={handleChange} placeholder="09:00 – 15:00" className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Sunday</label>
                      <input name="hoursSunday" value={footer.hoursSunday} onChange={handleChange} placeholder="Closed" className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)] mb-4">Social Media Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Instagram URL</label>
                    <input name="instagramUrl" value={footer.instagramUrl} onChange={handleChange} placeholder="https://instagram.com/..." className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">Facebook URL</label>
                    <input name="facebookUrl" value={footer.facebookUrl} onChange={handleChange} placeholder="https://facebook.com/..." className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">LINE URL</label>
                    <input name="lineUrl" value={footer.lineUrl} onChange={handleChange} placeholder="https://line.me/..." className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase mb-1 text-[var(--foreground-muted)]">WhatsApp URL</label>
                    <input name="whatsappUrl" value={footer.whatsappUrl} onChange={handleChange} placeholder="https://wa.me/..." className="w-full bg-white/50 border border-black/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PAYMENT */}
        {activeTab === 'payment' && (
          <div className="space-y-12">
            <div>
              <h2 className="text-xl font-serif text-[var(--foreground)] border-b border-black/5 pb-2 mb-6">Payment Settings</h2>
              {renderImageUploader("PromptPay QR Code Image", qrUrl, setQrUrl, "w-48 h-48")}
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-black/10">
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="btn-primary inline-flex items-center text-sm px-10 py-4"
        >
          {loading ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
