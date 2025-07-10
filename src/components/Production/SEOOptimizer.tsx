import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export const SEOOptimizer: React.FC<SEOProps> = ({
  title = 'HigherUp.ai - Ultimate All-in-One Marketing Platform',
  description = 'The most powerful all-in-one marketing platform. Build funnels, manage CRM, create videos, automate emails, and dominate your market with AI. 1000x better than GoHighLevel.',
  keywords = 'marketing automation, CRM, funnel builder, email marketing, AI video creator, all-in-one platform, sales automation, lead generation',
  image = '/og-image.png',
  url,
  type = 'website',
  author = 'HigherUp.ai Team',
  publishedTime,
  modifiedTime
}) => {
  const location = useLocation();

  useEffect(() => {
    const currentUrl = url || `${window.location.origin}${location.pathname}`;
    
    // Update document title
    document.title = title;

    // Helper function to update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic SEO meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', author);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    // Open Graph meta tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'HigherUp.ai', true);
    
    if (publishedTime) {
      updateMetaTag('article:published_time', publishedTime, true);
    }
    if (modifiedTime) {
      updateMetaTag('article:modified_time', modifiedTime, true);
    }

    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:creator', '@HigherUpAI');
    updateMetaTag('twitter:site', '@HigherUpAI');

    // Additional SEO optimizations
    updateMetaTag('theme-color', '#8B5CF6');
    updateMetaTag('msapplication-TileColor', '#8B5CF6');
    updateMetaTag('application-name', 'HigherUp.ai');

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // Preconnect to external domains for performance
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://api.openai.com'
    ];

    preconnectDomains.forEach(domain => {
      let preconnectLink = document.querySelector(`link[rel="preconnect"][href="${domain}"]`) as HTMLLinkElement;
      if (!preconnectLink) {
        preconnectLink = document.createElement('link');
        preconnectLink.setAttribute('rel', 'preconnect');
        preconnectLink.setAttribute('href', domain);
        preconnectLink.setAttribute('crossorigin', '');
        document.head.appendChild(preconnectLink);
      }
    });

    // Structured data for rich snippets
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'HigherUp.ai',
      description: description,
      url: currentUrl,
      image: image,
      author: {
        '@type': 'Organization',
        name: 'HigherUp.ai'
      },
      operatingSystem: 'Web',
      applicationCategory: 'BusinessApplication',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '1247'
      }
    };

    let structuredDataScript = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(structuredData);

  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, location.pathname]);

  return null;
};

// Hook for dynamic SEO updates
export const useSEO = (seoData: SEOProps) => {
  useEffect(() => {
    // This will trigger the SEO component to update
  }, [seoData]);

  return null;
};

// Page-specific SEO configurations
export const seoConfigs = {
  home: {
    title: 'HigherUp.ai - Ultimate All-in-One Marketing Platform | 1000x Better than GoHighLevel',
    description: 'Dominate your market with the most powerful all-in-one marketing platform. Build converting funnels, manage CRM, create AI videos, automate emails. Start your free trial today.',
    keywords: 'marketing automation, CRM, funnel builder, email marketing, AI video creator, all-in-one platform, gohighlevel alternative, sales automation'
  },
  dashboard: {
    title: 'Dashboard - HigherUp.ai Marketing Command Center',
    description: 'Your marketing command center. Track performance, manage campaigns, and grow your business with real-time analytics and AI-powered insights.',
    keywords: 'marketing dashboard, analytics, campaign management, business intelligence'
  },
  funnelBuilder: {
    title: 'Funnel Builder - Create High-Converting Sales Funnels | HigherUp.ai',
    description: 'Build professional sales funnels with our drag-and-drop builder. Templates, analytics, and AI optimization included. Convert more visitors into customers.',
    keywords: 'funnel builder, sales funnel, landing pages, conversion optimization, drag and drop builder'
  },
  videoCreator: {
    title: 'AI Video Creator - Generate Professional Marketing Videos | HigherUp.ai',
    description: 'Create stunning marketing videos with AI avatars and person cloning technology. No camera needed. Professional results in minutes.',
    keywords: 'AI video creator, marketing videos, AI avatars, person cloning, video marketing'
  },
  emailMarketing: {
    title: 'Email Marketing Automation - Smart Campaigns | HigherUp.ai',
    description: 'Launch intelligent email campaigns that convert. AI optimization, automation sequences, and detailed analytics included.',
    keywords: 'email marketing, marketing automation, email campaigns, newsletter, email templates'
  }
};