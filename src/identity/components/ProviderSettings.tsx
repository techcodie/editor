import { Check, CloudCog, PlugZap } from 'lucide-react'
import type { IdentityProvider } from '../types/identity'

const FUTURE_PROTOCOLS = [
  'Azure AD',
  'Okta',
  'Auth0',
  'Google Workspace',
  'Keycloak',
  'LDAP',
  'SAML',
  'OIDC',
]

interface ProviderSettingsProps {
  providers: IdentityProvider[]
}

export function ProviderSettings({ providers }: ProviderSettingsProps) {
  return (
    <section aria-labelledby="identity-providers-title">
      <h3 id="identity-providers-title" className="text-xs font-semibold text-neutral-950 dark:text-white">Identity providers</h3>
      <p className="mt-0.5 text-[10px] text-neutral-500">Host-registered adapters only</p>
      {providers.length ? (
        <div className="mt-3 space-y-2">
          {providers.map((provider) => (
            <article key={provider.id} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><PlugZap size={14} aria-hidden /></span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold text-neutral-800 dark:text-neutral-200">{provider.name}</p>
                <p className="text-[8px] uppercase text-neutral-400">{provider.protocol}</p>
              </div>
              <span className="ml-auto flex items-center gap-1 text-[8px] font-semibold text-emerald-700 dark:text-emerald-300"><Check size={10} aria-hidden />Registered</span>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-neutral-300 p-5 text-center dark:border-neutral-700">
          <CloudCog size={20} className="mx-auto text-neutral-300" aria-hidden />
          <p className="mt-2 text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">Direct host identity</p>
          <p className="mt-1 text-[9px] leading-4 text-neutral-500">No external provider adapter is registered for this instance.</p>
        </div>
      )}
      <div className="mt-5">
        <h4 className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">Adapter-ready protocols</h4>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FUTURE_PROTOCOLS.map((protocol) => (
            <span key={protocol} className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-[8px] font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
              {protocol}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
