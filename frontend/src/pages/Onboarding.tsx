import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Loader2, Plus, Trash2, AlertCircle } from 'lucide-react'

const API_BASE_URL = 'https://mallanproject-production.up.railway.app'

interface Competitor {
  id: number
  name: string
  url: string
  keywords: string
}

interface MarketKeyword {
  id: number
  keyword: string
  category: string
}

const REGIONS = [
  { code: 'nl', name: 'Netherlands' },
  { code: 'mt', name: 'Malta' },
  { code: 'uk', name: 'UK' },
  { code: 'de', name: 'Germany' },
]

const CATEGORIES = [
  { value: '', label: 'Select category (optional)' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'problem', label: 'Problem' },
  { value: 'product', label: 'Product' },
  { value: 'regulation', label: 'Regulation' },
  { value: 'review', label: 'Review' },
]

const STEPS = [
  { number: 1, title: 'Your Brand' },
  { number: 2, title: 'Brand Keywords' },
  { number: 3, title: 'Competitors' },
  { number: 4, title: 'Market Keywords' },
]

// Combined form state interface
interface FormData {
  // Step 1: Brand info
  brandName: string
  brandUrl: string
  regionCode: string
  regionName: string
  // Step 2: Brand keywords
  brandKeywords: string
  // Step 3: Competitors
  competitors: Competitor[]
  // Step 4: Market keywords
  marketKeywords: MarketKeyword[]
}

const initialFormData: FormData = {
  brandName: '',
  brandUrl: '',
  regionCode: '',
  regionName: '',
  brandKeywords: '',
  competitors: [{ id: 1, name: '', url: '', keywords: '' }],
  marketKeywords: [{ id: 1, keyword: '', category: '' }],
}

export function Onboarding() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Single state object for all form data - persists across all steps
  const [formData, setFormData] = useState<FormData>(initialFormData)

  // Helper to update form data
  const updateFormData = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle region selection - stores both code and name
  const handleRegionChange = (code: string) => {
    const selectedRegion = REGIONS.find(r => r.code === code)
    setFormData(prev => ({
      ...prev,
      regionCode: code,
      regionName: selectedRegion?.name || ''
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.brandName.trim() && formData.brandUrl.trim() && formData.regionCode
      case 2:
        return formData.brandKeywords.trim().split('\n').filter(k => k.trim()).length >= 1
      case 3:
        return formData.competitors.some(c => c.name.trim())
      case 4:
        return true // Market keywords are optional
      default:
        return false
    }
  }

  const nextStep = () => {
    if (currentStep < 4 && canProceed()) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const addCompetitor = () => {
    if (formData.competitors.length < 10) {
      updateFormData('competitors', [...formData.competitors, { id: Date.now(), name: '', url: '', keywords: '' }])
    }
  }

  const removeCompetitor = (id: number) => {
    if (formData.competitors.length > 1) {
      updateFormData('competitors', formData.competitors.filter(c => c.id !== id))
    }
  }

  const updateCompetitor = (id: number, field: keyof Competitor, value: string) => {
    updateFormData('competitors', formData.competitors.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

  const addMarketKeyword = () => {
    updateFormData('marketKeywords', [...formData.marketKeywords, { id: Date.now(), keyword: '', category: '' }])
  }

  const removeMarketKeyword = (id: number) => {
    if (formData.marketKeywords.length > 1) {
      updateFormData('marketKeywords', formData.marketKeywords.filter(k => k.id !== id))
    }
  }

  const updateMarketKeyword = (id: number, field: keyof MarketKeyword, value: string) => {
    updateFormData('marketKeywords', formData.marketKeywords.map(k =>
      k.id === id ? { ...k, [field]: value } : k
    ))
  }

  const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement> | React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    setIsSubmitting(true)
    setError(null)

    // Build payload from combined formData state - matches API expectations
    const payload = {
      brandName: formData.brandName.trim(),
      brandUrl: formData.brandUrl.trim(),
      regionCode: formData.regionCode,
      regionName: formData.regionName,
      brandKeywords: formData.brandKeywords
        .split('\n')
        .map(k => k.trim())
        .filter(k => k),
      competitors: formData.competitors
        .filter(c => c.name.trim())
        .map(c => ({
          name: c.name.trim(),
          url: c.url.trim(),
          keywords: c.keywords
            .split('\n')
            .map(k => k.trim())
            .filter(k => k),
        })),
      marketKeywords: formData.marketKeywords
        .filter(k => k.keyword.trim())
        .map(k => ({
          keyword: k.keyword.trim(),
          category: k.category || null,
        })),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tenants/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      setSuccess(true)
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tenant')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-forest-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Welcome aboard!</h2>
          <p className="text-slate-600">Your account has been created. Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Set up your account</h1>
          <p className="text-slate-600">Let's get your brand tracking configured</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentStep > step.number
                      ? 'bg-forest-600 text-white'
                      : currentStep === step.number
                      ? 'bg-forest-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className={`text-xs mt-1 ${
                  currentStep >= step.number ? 'text-forest-600 font-medium' : 'text-slate-400'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-16 h-1 mx-2 rounded ${
                  currentStep > step.number ? 'bg-forest-600' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* Step 1: Your Brand */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">Your Brand</h2>
                <p className="text-slate-500 text-sm">Tell us about your brand</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => updateFormData('brandName', e.target.value)}
                    placeholder="Your brand name"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.brandUrl}
                    onChange={(e) => updateFormData('brandUrl', e.target.value)}
                    placeholder="https://yourbrand.com"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Region
                  </label>
                  <select
                    value={formData.regionCode}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-slate-900 bg-white"
                  >
                    <option value="">Select a region</option>
                    {REGIONS.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Brand Keywords */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">Your Brand Keywords</h2>
                <p className="text-slate-500 text-sm">Enter 5-10 keywords people search to find your brand</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Keywords (one per line)
                </label>
                <textarea
                  value={formData.brandKeywords}
                  onChange={(e) => updateFormData('brandKeywords', e.target.value)}
                  placeholder={`your brand name\nyourbrand.com\nyour brand online`}
                  rows={8}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-slate-900 placeholder-slate-400 resize-none font-mono text-sm"
                />
                <p className="text-xs text-slate-400 mt-2">
                  {formData.brandKeywords.split('\n').filter(k => k.trim()).length} keywords entered
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Competitors */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">Competitors</h2>
                <p className="text-slate-500 text-sm">Add up to 10 competitors to track</p>
              </div>

              <div className="space-y-4">
                {formData.competitors.map((competitor, index) => (
                  <div
                    key={competitor.id}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700">
                        Competitor {index + 1}
                      </span>
                      {formData.competitors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCompetitor(competitor.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={competitor.name}
                        onChange={(e) => updateCompetitor(competitor.id, 'name', e.target.value)}
                        placeholder="Competitor name"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-slate-900 placeholder-slate-400 text-sm bg-white"
                      />
                      <input
                        type="url"
                        value={competitor.url}
                        onChange={(e) => updateCompetitor(competitor.id, 'url', e.target.value)}
                        placeholder="https://competitor.com"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-slate-900 placeholder-slate-400 text-sm bg-white"
                      />
                      <textarea
                        value={competitor.keywords}
                        onChange={(e) => updateCompetitor(competitor.id, 'keywords', e.target.value)}
                        placeholder="Keywords (one per line)"
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-slate-900 placeholder-slate-400 text-sm resize-none font-mono bg-white"
                      />
                    </div>
                  </div>
                ))}

                {formData.competitors.length < 10 && (
                  <button
                    type="button"
                    onClick={addCompetitor}
                    className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-forest-500 hover:text-forest-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Competitor ({formData.competitors.length}/10)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Market Keywords */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">Market Keywords</h2>
                <p className="text-slate-500 text-sm">Add keywords to track market trends (optional)</p>
              </div>

              <div className="space-y-3">
                {formData.marketKeywords.map((mk) => (
                  <div key={mk.id} className="flex gap-2">
                    <input
                      type="text"
                      value={mk.keyword}
                      onChange={(e) => updateMarketKeyword(mk.id, 'keyword', e.target.value)}
                      placeholder="Enter keyword"
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-slate-900 placeholder-slate-400 text-sm"
                    />
                    <select
                      value={mk.category}
                      onChange={(e) => updateMarketKeyword(mk.id, 'category', e.target.value)}
                      className="w-40 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent text-slate-900 bg-white text-sm"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {formData.marketKeywords.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMarketKeyword(mk.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMarketKeyword}
                  className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-forest-500 hover:text-forest-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Keyword
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600">
                  <strong>Tip:</strong> Categories help organize your keywords:
                </p>
                <ul className="text-xs text-slate-500 mt-2 space-y-1">
                  <li><strong>Comparison:</strong> "casino vergelijken", "beste online casino"</li>
                  <li><strong>Problem:</strong> "casino problemen", "gokverslaving"</li>
                  <li><strong>Product:</strong> "live casino", "casino bonus"</li>
                  <li><strong>Regulation:</strong> "casino vergunning", "KSA"</li>
                  <li><strong>Review:</strong> "casino review", "ervaringen"</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-5 py-2.5 bg-forest-600 text-white rounded-lg font-medium hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-forest-600 text-white rounded-lg font-medium hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Complete Setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Skip for now link */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
