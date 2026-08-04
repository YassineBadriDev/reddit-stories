import { site } from "./site";
import type { Story } from "@/lib/scraper/types";

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        alternateName: site.alternateName,
        description: site.description,
        inLanguage: site.language,
        publisher: { "@id": `${site.url}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${site.url}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${site.url}/#organization`,
        url: site.url,
        name: site.publisher,
        logo: { "@type": "ImageObject", url: site.logo },
        sameAs: site.sameAs,
      },
    ],
  };
}

export function itemListSchema(stories: Story[], path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${site.url}${path}/#collection`,
    url: `${site.url}${path}`,
    name: site.name,
    description: site.description,
    inLanguage: site.language,
    isPartOf: { "@id": `${site.url}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: stories.length,
      itemListElement: stories.map((story, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: story.url,
        name: story.title,
      })),
    },
  };
}

export function storySchema(story: Story) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${story.url}/#article`,
    headline: story.title,
    url: story.url,
    description: story.excerpt,
    inLanguage: "en",
    isPartOf: {
      "@id": `${site.url}/#website`,
    },
    author: {
      "@type": "Person",
      name: story.author,
    },
    datePublished: story.createdAt,
    dateModified: story.createdAt,
    mainEntityOfPage: story.url,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: story.score,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: story.comments,
      },
    ],
  };
}

export function breadcrumbSchema(items: { name: string; url?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}
