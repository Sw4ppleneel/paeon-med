import { useState, useEffect } from 'react';
import { IntelligentHeader } from './components/IntelligentHeader';
import { ChapterNavigation } from './components/ChapterNavigation';
import { DrugIdentity } from './components/DrugIdentity';
import { MechanismCard } from './components/MechanismCard';
import { CoverageStatus } from './components/CoverageStatus';
import { ComparisonTable } from './components/ComparisonTable';
import { ComplianceCard } from './components/ComplianceCard';
import { AccessPanel } from './components/AccessPanel';
import { SearchBar } from './components/SearchBar';
import { TalkMore } from './components/TalkMore';
import { CompanyOverview } from './components/CompanyOverview';
import { Footer } from './components/Footer';
import { FloatingCallButton } from './components/FloatingCallButton';
import { useDrugProfile } from './hooks/useDrugProfile';
import { fetchCompanyProfile } from './api/companyProfile';
import type { SearchMode } from './components/SearchBar';
import type { CompanyOverviewCard } from './types/api';

type ViewMode = 'empty' | 'drug' | 'company';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChapter, setActiveChapter] = useState('identity');
  const [isNearBottom, setIsNearBottom] = useState(false);
  const [reimbLoading, setReimbLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('drug');
  const [viewMode, setViewMode] = useState<ViewMode>('empty');

  // Company state
  const [companyData, setCompanyData] = useState<CompanyOverviewCard | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const { data: profile, loading, error, fetch: fetchProfile } = useDrugProfile();

  const hasGeneratedContent = viewMode === 'drug' && profile !== null;
  const hasCompanyContent = viewMode === 'company' && companyData !== null;

  // ── Drug Search Handler (uses full /api/drug-profile for enriched view) ───
  const handleDrugSearch = (query: string) => {
    if (query.trim()) {
      setSearchQuery(query);
      setViewMode('drug');
      setCompanyData(null);
      setCompanyError(null);
      setActiveChapter('identity');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchProfile({ drug_name: query.trim() });
    }
  };

  // ── Company Search Handler (uses /api/company-profile, deterministic) ─────
  const handleCompanySearch = async (query: string) => {
    if (!query.trim()) return;
    setSearchQuery(query);
    setViewMode('company');
    setCompanyLoading(true);
    setCompanyError(null);
    setCompanyData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const result = await fetchCompanyProfile({ company_name: query.trim() });
      setCompanyData(result);
    } catch (err) {
      setCompanyError(err instanceof Error ? err.message : 'Failed to fetch company profile');
    } finally {
      setCompanyLoading(false);
    }
  };

  // ── Hero product click: company → drug transition ─────────────────────────
  const handleHeroDrugSelect = (drugName: string) => {
    setSearchMode('drug');
    handleDrugSearch(drugName);
  };

  const handleReimbursement = async (data: { insurance_type: string; diagnosis: string; claim_amount: number }) => {
    if (!searchQuery.trim()) return;
    setReimbLoading(true);
    try {
      await fetchProfile({
        drug_name: searchQuery.trim(),
        insurance_type: data.insurance_type,
        diagnosis: data.diagnosis,
        claim_amount: data.claim_amount,
      });
      setTimeout(() => {
        const el = document.getElementById('access');
        if (el) {
          const offset = 150;
          const pos = el.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: pos, behavior: 'smooth' });
        }
      }, 300);
    } finally {
      setReimbLoading(false);
    }
  };

  const handleChapterClick = (chapterId: string) => {
    const element = document.getElementById(chapterId);
    if (element) {
      const offset = 150;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  // Scroll tracking for active chapter highlighting
  useEffect(() => {
    if (!hasGeneratedContent) return;

    const handleScroll = () => {
      const chapters = ['identity', 'comparison', 'access', 'compliance'];
      const scrollPosition = window.scrollY + 200;

      for (let i = chapters.length - 1; i >= 0; i--) {
        const element = document.getElementById(chapters[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveChapter(chapters[i]);
          break;
        }
      }

      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      setIsNearBottom(distanceFromBottom < 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasGeneratedContent]);

  const isAnyLoading = loading || companyLoading;
  const isAnyError = (error && viewMode === 'drug') || (companyError && viewMode === 'company');
  const errorMessage = viewMode === 'drug' ? error : companyError;

  // ── Company-specific background gradient orb colors ────────────────────
  const companyGradientMap: Record<string, [string, string, string]> = {
    "dr. reddy's":              ['#F06292', '#EC407A', '#E91E63'],   // pink
    "dr. reddy's laboratories": ['#F06292', '#EC407A', '#E91E63'],
    emcure:                     ['#B388FF', '#9C27B0', '#7C4DFF'],   // purple
    "emcure pharmaceuticals":   ['#B388FF', '#9C27B0', '#7C4DFF'],
    "sun pharma":               ['#FFD54F', '#FFB300', '#FFA000'],   // amber / yellowish
    lupin:                      ['#4DB6AC', '#26A69A', '#009688'],   // teal
    astrazeneca:                ['#FF8A65', '#EF6C00', '#FF5722'],   // warm sunset orange
    cipla:                      ['#00AEEF', '#26A69A', '#1976D2'],   // default blue/teal
    pfizer:                     ['#42A5F5', '#1E88E5', '#1565C0'],   // deeper blue
    "johnson & johnson":        ['#00AEEF', '#26A69A', '#1976D2'],   // default
  };

  const normalizedCompany = searchQuery.trim().toLowerCase();
  const orbColors = (viewMode === 'company' && companyGradientMap[normalizedCompany])
    ? companyGradientMap[normalizedCompany]
    : ['#00AEEF', '#26A69A', '#1976D2']; // default orb colors

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F5F7]">
      {/* Animated Gradient Orbs (Northern Lights) — color-matched to active company */}
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute left-[20%] top-[10%] h-[600px] w-[600px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: `radial-gradient(circle, ${orbColors[0]} 0%, transparent 70%)`,
            animation: 'float 20s ease-in-out infinite',
            transition: 'background 1s ease',
          }}
        />
        <div 
          className="absolute right-[15%] top-[30%] h-[500px] w-[500px] rounded-full opacity-25 blur-[100px]"
          style={{
            background: `radial-gradient(circle, ${orbColors[1]} 0%, transparent 70%)`,
            animation: 'float 25s ease-in-out infinite reverse',
            transition: 'background 1s ease',
          }}
        />
        <div 
          className="absolute bottom-[10%] left-[40%] h-[550px] w-[550px] rounded-full opacity-20 blur-[110px]"
          style={{
            background: `radial-gradient(circle, ${orbColors[2]} 0%, transparent 70%)`,
            animation: 'float 30s ease-in-out infinite',
            transition: 'background 1s ease',
          }}
        />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
      `}</style>

      {/* Loading State */}
      {isAnyLoading && (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div
              className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-black/10"
              style={{ borderTopColor: orbColors[2] }}
            />
            <h2
              className="mb-2 text-2xl font-bold tracking-tight text-black/50"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              {viewMode === 'company' ? 'Finding Company' : 'Generating Insights'}
            </h2>
            <p
              className="text-base font-semibold text-black/30"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              {viewMode === 'company' ? 'Loading profile for' : 'Fetching profile for'}{' '}
              <span className="text-black/50">{searchQuery}</span>…
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {isAnyError && !isAnyLoading && (
        <div className="flex min-h-screen items-center justify-center">
          <div className="mx-auto max-w-md text-center">
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: 'rgba(211, 47, 47, 0.1)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2
              className="mb-2 text-2xl font-bold tracking-tight text-black/60"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              Something went wrong
            </h2>
            <p
              className="mb-6 text-sm font-semibold text-black/40"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              {errorMessage}
            </p>
            <button
              onClick={() => viewMode === 'drug' ? handleDrugSearch(searchQuery) : handleCompanySearch(searchQuery)}
              className="rounded-full px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
                boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════ COMPANY VIEW ═══════════════════ */}
      {hasCompanyContent && !companyLoading && companyData && (
        <>
          <CompanyOverview data={companyData} onDrugSelect={handleHeroDrugSelect} />

          {/* Talk More for company context */}
          <TalkMore drugContext={companyData.hero_product.drug_name || companyData.company_name} />

          <Footer />
        </>
      )}

      {/* ═══════════════════ DRUG VIEW ═══════════════════ */}
      {hasGeneratedContent && !loading && (
        <>
          {/* Spelling Correction Banner */}
          {profile?.suggested_name && (
            <div className="relative z-20 mx-auto mt-4 max-w-[900px] px-8">
              <div
                className="flex items-center gap-3 rounded-2xl px-5 py-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(25, 118, 210, 0.2)',
                  boxShadow: '0 2px 12px rgba(25, 118, 210, 0.08)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1976D2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <p
                  className="text-sm font-medium text-black/60"
                  style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
                >
                  Showing results for{' '}
                  <span className="font-bold text-[#1976D2]">{profile.suggested_name}</span>
                  <span className="text-black/40"> (corrected from &ldquo;{searchQuery}&rdquo;)</span>
                </p>
              </div>
            </div>
          )}

          {/* Intelligent Header with Brand Detection */}
          <IntelligentHeader
            brand={profile?.brand ? {
              name: profile.brand.name || '',
              color: profile.brand.color || '#007AFF',
              tagline: profile.brand.tagline || '',
              division: profile.brand.division || undefined,
              background_gradient: profile.brand.background_gradient || undefined,
            } : undefined}
            company={profile?.company ? {
              overview: profile.company.overview || '',
              specialties: profile.company.specialties || '',
              stats: (profile.company.stats || {}) as Record<string, string>,
              mission: profile.company.mission || '',
            } : undefined}
            drugName={profile?.drug_display?.name || searchQuery}
          />

          {/* Chapter Navigation (Sticky) */}
          <ChapterNavigation activeChapter={activeChapter} onChapterClick={handleChapterClick} />

          {/* Single Column Content Stream */}
          <div className="relative mx-auto max-w-[900px] px-8 pb-40">
            <div className="flex flex-col gap-16">
              {/* CHAPTER 1: IDENTITY */}
              <div id="identity" className="scroll-mt-32 flex flex-col gap-12">
                <DrugIdentity
                  drugDisplay={profile?.drug_display || undefined}
                  brandColor={profile?.brand?.color || '#007AFF'}
                  brandName={profile?.brand?.name || ''}
                />
                {profile?.mechanism?.title && profile?.mechanism?.text && (
                  <MechanismCard mechanismData={{
                    title: profile.mechanism.title,
                    text: profile.mechanism.text,
                  }} />
                )}
              </div>

              {/* CHAPTER 2: COMPARISON */}
              {profile?.comparison_display && profile.comparison_display.rows?.length > 0 && (
                <div id="comparison" className="scroll-mt-32">
                  <ComparisonTable
                    comparisonData={{
                      competitor: profile.comparison_display.competitor || 'Competitor',
                      rows: profile.comparison_display.rows.map((r: any) => ({
                        metric: r.metric,
                        value: r.value,
                        competitorValue: r.competitor_value,
                        winner: r.winner,
                      })),
                    }}
                    brandColor={profile?.brand?.color || '#007AFF'}
                  />
                </div>
              )}
              {!profile?.comparison_display && (
                <div id="comparison" className="scroll-mt-32" />
              )}

              {/* CHAPTER 3: ACCESS — coverage + reimbursement */}
              <div id="access" className="scroll-mt-32 flex flex-col gap-8">
                {profile?.coverage_display && (
                  <CoverageStatus coverageData={profile.coverage_display} />
                )}
                <AccessPanel
                  drugName={profile?.drug_display?.name || searchQuery}
                  onSubmit={handleReimbursement}
                  loading={reimbLoading}
                  reimbursement={profile?.reimbursement as any}
                />
              </div>

              {/* CHAPTER 4: COMPLIANCE */}
              {profile?.compliance_display && (
                <div id="compliance" className="scroll-mt-32">
                  <ComplianceCard
                    complianceData={{
                      regulatory: {
                        status: profile.compliance_display.regulatory_status || 'Unknown',
                        authority: profile.compliance_display.regulatory_authority || 'N/A',
                        icon: (profile.compliance_display.regulatory_status || '').toLowerCase().includes('approved') ? 'check' : 'warning',
                      },
                      pregnancy: {
                        category: profile.compliance_display.pregnancy_category || 'N/A',
                        icon: (profile.compliance_display.pregnancy_category || '').includes('X') || (profile.compliance_display.pregnancy_category || '').includes('D') ? 'alert' : 'shield',
                      },
                      boxedWarning: {
                        status: profile.compliance_display.boxed_warning || 'None',
                        icon: (profile.compliance_display.boxed_warning || 'None').toLowerCase() === 'none' ? 'check' : 'alert',
                      },
                      citations: profile.compliance_display.citations || [],
                    }}
                  />
                </div>
              )}
              {!profile?.compliance_display && (
                <div id="compliance" className="scroll-mt-32" />
              )}
            </div>
          </div>

          {/* Talk More — ONLY calls /api/ask, never triggers search */}
          {isNearBottom && (
            <TalkMore drugContext={profile?.drug_display?.name || searchQuery} />
          )}

          <Footer />
        </>
      )}

      {/* ═══════════════════ EMPTY STATE ═══════════════════ */}
      {viewMode === 'empty' && !isAnyLoading && !isAnyError && (
        <div className="flex min-h-screen items-center justify-center pb-28">
          <div className="text-center">
            <h2 
              className="mb-4 text-4xl font-bold tracking-tight text-black/40"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              {searchMode === 'drug' ? 'Ask about any medication' : 'Search for a company'}
            </h2>
            <p 
              className="mb-8 text-lg font-semibold text-black/30"
              style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
            >
              {searchMode === 'drug'
                ? 'Type a drug name to generate intelligent insights'
                : 'Enter a company name to view their profile & hero product'}
            </p>

            {/* Quick Examples */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span 
                className="text-xs uppercase tracking-wider font-normal text-black/30"
                style={{ fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif' }}
              >
                Try:
              </span>
              {searchMode === 'drug' ? (
                ['Ciplactin', 'Ciplar', 'Tremfya', 'Dolo 650', 'Xeljanz'].map((drug) => (
                  <button
                    key={drug}
                    onClick={() => handleDrugSearch(drug)}
                    className="rounded-full px-4 py-2 text-sm font-normal transition-all hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      color: 'rgba(0, 0, 0, 0.6)',
                      fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif'
                    }}
                  >
                    {drug}
                  </button>
                ))
              ) : (
                ['Cipla', 'Pfizer', 'Sun Pharma', 'AstraZeneca', 'Lupin'].map((company) => (
                  <button
                    key={company}
                    onClick={() => handleCompanySearch(company)}
                    className="rounded-full px-4 py-2 text-sm font-normal transition-all hover:scale-105"
                    style={{
                      background: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(38, 166, 154, 0.15)',
                      color: 'rgba(0, 0, 0, 0.6)',
                      fontFamily: 'Source Sans Pro, -apple-system, system-ui, sans-serif'
                    }}
                  >
                    {company}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ SEARCH BAR (always visible, bottom) ═══════════ */}
      <SearchBar
        onDrugSearch={handleDrugSearch}
        onCompanySearch={handleCompanySearch}
        isActive={hasGeneratedContent || hasCompanyContent}
        currentQuery={searchQuery}
        mode={searchMode}
        onModeChange={setSearchMode}
      />

      {/* Floating Call Button */}
      <FloatingCallButton />
    </div>
  );
}