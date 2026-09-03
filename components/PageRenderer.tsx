import { ComponentRegistry } from '@/lib/components/registry';
import type { PageSection } from '@/lib/data/pages';

interface PageRendererProps {
  sections: PageSection[];
}

export default function PageRenderer({ sections }: PageRendererProps) {
  return (
    <>
      {sections.map((section) => {
        const Component = ComponentRegistry[section.component];

        // Unknown component names are silently skipped — prevents render errors
        // when a component is removed from the registry but still in the DB.
        if (!Component) return null;

        return <Component key={section.id} {...section.props} />;
      })}
    </>
  );
}
