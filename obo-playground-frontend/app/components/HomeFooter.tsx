/**
 * Home Page Footer Component
 * Footer with links and copyright
 */

import React from 'react';
import { HOME_CONSTANTS } from '../constants';

export default function HomeFooter() {
  const { PLATFORM, RESOURCES, COMPANY, LEGAL } = HOME_CONSTANTS.FOOTER.SECTIONS;

  return (
    <footer className="mt-20 border-t border-neutral-900 bg-black py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-4">
          <FooterColumn title={PLATFORM.title} links={PLATFORM.links} />
          <FooterColumn title={RESOURCES.title} links={RESOURCES.links} />
          <FooterColumn title={COMPANY.title} links={COMPANY.links} />
          <FooterColumn title={LEGAL.title} links={LEGAL.links} />
        </div>
        <Copyright />
      </div>
    </footer>
  );
}

/**
 * Footer Column with Links
 */
interface FooterColumnProps {
  title: string;
  links: Array<{ label: string; href: string }>;
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h3 className="mb-4 font-[family-name:var(--font-red-hat-display)] text-sm font-bold text-white">
        {title}
      </h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="text-sm text-neutral-400 hover:text-white">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Copyright Section
 */
function Copyright() {
  return (
    <div className="border-t border-neutral-900 pt-8 text-center">
      <p className="text-sm text-neutral-500">{HOME_CONSTANTS.FOOTER.COPYRIGHT}</p>
    </div>
  );
}
