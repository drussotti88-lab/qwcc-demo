'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Eye, ClipboardCheck, Shield, Users,
  RefreshCw, Settings, ChevronRight, Activity, Building2, ListChecks
} from 'lucide-react';

const nav = [
  { href: '/dashboard',              label: 'PORTFOLIO',      icon: LayoutDashboard, section: 'Overview',     demo: false },
  { href: '/dashboard/quality',      label: 'QUALITY',        icon: Activity,        section: 'Dashboards',   demo: false },
  { href: '/dashboard/observations', label: 'OBSERVATIONS',   icon: Eye,             section: 'Dashboards',   demo: false },
  { href: '/dashboard/inspections',  label: 'INSPECTIONS',    icon: ClipboardCheck,  section: 'Dashboards',   demo: false },
  { href: '/dashboard/warranty',     label: 'WARRANTY',       icon: Shield,          section: 'Dashboards',   demo: false },
  { href: '/dashboard/subcontractors', label: 'SUBCONTRACTORS', icon: Users,         section: 'Performance',  demo: false },
  { href: '/dashboard/dfw',          label: 'DFW LOG',        icon: ListChecks,      section: 'Field QA',     demo: true  },
];

export function Sidebar() {
  const pathname = usePathname();
  const sections = [...new Set(nav.map(n => n.section))];

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col bg-card border-r border-border z-50">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-display text-sm tracking-widest text-foreground leading-none">QWCC</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 font-mono">COMMAND CENTER</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {sections.map(section => (
          <div key={section} className="mb-4">
            <p className="text-[10px] font-mono text-muted-foreground/50 px-3 mb-1.5 tracking-widest uppercase">
              {section}
            </p>
            {nav.filter(n => n.section === section).map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              if (!item.demo && !active) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium tracking-widest mb-0.5 opacity-30 cursor-not-allowed"
                  >
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{item.label}</span>
                    <span className="ml-auto font-mono text-[9px] opacity-60">—</span>
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium tracking-widest transition-all duration-200 mb-0.5',
                    active
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <item.icon className={cn('w-3.5 h-3.5 flex-shrink-0', active ? 'text-primary' : '')} />
                  <span>{item.label}</span>
                  {item.demo && !active && (
                    <span className="ml-auto font-mono text-[9px] text-amber-400/60 border border-amber-400/20 rounded px-1">DEMO</span>
                  )}
                  {active && <ChevronRight className="w-3 h-3 ml-auto text-primary/60" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded text-xs text-muted-foreground/30 tracking-widest cursor-not-allowed">
          <RefreshCw className="w-3.5 h-3.5" />
          SYNC
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded text-xs text-muted-foreground/30 tracking-widest cursor-not-allowed">
          <Settings className="w-3.5 h-3.5" />
          SETTINGS
        </div>
      </div>

      {/* Demo watermark */}
      <div className="px-4 py-3 border-t border-border">
        <p className="font-mono text-[9px] text-white/15 text-center tracking-widest">DEMO MODE · DFW ONLY</p>
      </div>
    </aside>
  );
}
