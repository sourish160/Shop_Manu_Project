import { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'restaurant' | 'article';
  ogImage?: string | null;
  noIndex?: boolean;
  jsonLd?: Record<string, any> | null;
}

const DEFAULT_TITLE = 'ShopManu | Restaurant & Menu Discovery';
const DEFAULT_DESCRIPTION = 'Find restaurants, menus, dishes, authentic variant prices, and verified dining places near you.';
const SITE_NAME = 'ShopManu';

/**
 * Custom hook to dynamically manage head metadata, Open Graph, Twitter cards,
 * canonical links, indexability (robots), and Schema.org JSON-LD structured data.
 */
export function useSEO(props: SEOProps) {
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://shopmanu.com';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : origin;

    // 1. Title
    const formattedTitle = props.title ? `${props.title} | ${SITE_NAME}` : DEFAULT_TITLE;
    document.title = formattedTitle;

    // Helper to set or create meta tag
    const setMetaTag = (attrName: 'name' | 'property', attrValue: string, content: string | null) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (content !== null && content !== undefined && content.trim() !== '') {
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(attrName, attrValue);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content.trim());
      } else if (element) {
        element.remove();
      }
    };

    // 2. Standard Description
    const desc = props.description || DEFAULT_DESCRIPTION;
    setMetaTag('name', 'description', desc);

    // 3. Robots / Indexability
    if (props.noIndex) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      setMetaTag('name', 'robots', 'index, follow');
    }

    // 4. Canonical Link
    const canonicalHref = props.canonicalUrl || currentUrl.split('?')[0]; // strip volatile queries for canonical baseline
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonicalHref) {
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute('href', canonicalHref);
    }

    // 5. Open Graph
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', desc);
    setMetaTag('property', 'og:type', props.ogType || 'website');
    setMetaTag('property', 'og:url', canonicalHref);
    if (props.ogImage) {
      setMetaTag('property', 'og:image', props.ogImage);
    } else {
      setMetaTag('property', 'og:image', `${origin}/favicon.svg`);
    }

    // 6. Twitter Card
    setMetaTag('name', 'twitter:card', props.ogImage ? 'summary_large_image' : 'summary');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', desc);
    if (props.ogImage) {
      setMetaTag('name', 'twitter:image', props.ogImage);
    }

    // 7. Schema.org Structured Data (JSON-LD)
    const scriptId = 'shopmanu-jsonld-structured-data';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (props.jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(props.jsonLd);
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      // Clean up JSON-LD on unmount or navigation
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [
    props.title,
    props.description,
    props.canonicalUrl,
    props.ogType,
    props.ogImage,
    props.noIndex,
    JSON.stringify(props.jsonLd),
  ]);
}
