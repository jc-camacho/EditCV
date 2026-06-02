function getSocialUrl(network, username) {
  const n = (network || '').toLowerCase()
  if (n === 'linkedin') return `https://linkedin.com/in/${username}`
  if (n === 'github')   return `https://github.com/${username}`
  if (n === 'twitter' || n === 'x') return `https://x.com/${username}`
  return null
}

function getSocialDisplayText(network, username) {
  const n = (network || '').toLowerCase()
  if (n === 'linkedin') return `linkedin.com/in/${username}`
  if (n === 'github')   return `github.com/${username}`
  if (n === 'twitter' || n === 'x') return `x.com/${username}`
  return username
}

export default function CVHeader({ cv }) {
  const socials = cv.social_networks || []
  const customs = cv.custom_connections || []

  // Each item carries a `type` hint so CSS-only templates (like modern) can
  // prepend the right icon via ::before without needing extra markup.
  const contactItems = [
    cv.location && { text: cv.location,                                        type: 'location' },
    cv.email    && { text: cv.email,    href: `mailto:${cv.email}`,            type: 'email'    },
    cv.phone    && { text: cv.phone,    href: `https://wa.me/${cv.phone.replace(/[\s+\-().]/g, '')}`, type: 'phone' },
    cv.website  && { text: cv.website.replace(/^https?:\/\//, ''), href: cv.website, type: 'website' },
    ...socials.map(s => s.username
      ? { text: getSocialDisplayText(s.network, s.username), href: s.url || getSocialUrl(s.network, s.username), type: 'social', network: s.network }
      : null
    ),
    ...customs.filter(Boolean).map(c => ({ text: c, type: 'custom' })),
  ].filter(Boolean)

  return (
    <header className="cvHeader">
      <h1 className="cvName">{cv.name}</h1>
      {cv.headline && <p className="cvHeadline">{cv.headline}</p>}
      {contactItems.length > 0 && (
        <p className="cvContact">
          {contactItems.map((item, i) => (
            // The separator must be a sibling BEFORE the icon span,
            // not a child inside it — otherwise ::before on the parent
            // renders the icon before the separator.
            <span key={i} className="cvContactItem">
              {i > 0 && <span className="contactSep" aria-hidden="true" />}
              {item.href
                ? <a href={item.href} target="_blank" rel="noopener noreferrer" data-contact-type={item.type}>{item.text}</a>
                : <span data-contact-type={item.type}>{item.text}</span>
              }
            </span>
          ))}
        </p>
      )}
    </header>
  )
}
