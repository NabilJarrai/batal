"use client";

import { useEffect, useMemo, useState } from 'react';
import { GroupResponse } from '@/types/groups';
import { PlayerDTO } from '@/types/players';
import GroupCard from '@/components/GroupCard';
import PlayerCard from '@/components/PlayerCard';

/**
 * Read-only views of who is in the academy, for the manager dashboard.
 *
 * Both work from the lists the dashboard has already loaded, so opening a
 * group costs no request. Changing groups and players stays on the admin page.
 */

const ageOf = (dateOfBirth?: string): number | null => {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const fullName = (p: PlayerDTO) => `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();

const byName = (a: PlayerDTO, b: PlayerDTO) => fullName(a).localeCompare(fullName(b));

type ViewMode = 'cards' | 'list';

/** Remembered per tab on this device; a blocked storage just means the default. */
function useViewMode(key: string): [ViewMode, (mode: ViewMode) => void] {
  const storageKey = `manager-${key}-layout`;
  const [mode, setMode] = useState<ViewMode>('cards');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'cards' || saved === 'list') setMode(saved);
    } catch {}
  }, [storageKey]);

  const update = (next: ViewMode) => {
    setMode(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {}
  };

  return [mode, update];
}

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  const option = (value: ViewMode, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={mode === value}
      title={`${label} view`}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
        mode === value ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="inline-flex shrink-0 rounded-lg border border-border p-0.5">
      {option('cards', 'Cards', (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h6v6H4zM14 5h6v6h-6zM4 13h6v6H4zM14 13h6v6h-6z" />
        </svg>
      ))}
      {option('list', 'List', (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ))}
    </div>
  );
}

// The coach page's grid, so the cards look the same there and here. Literal
// classes rather than ResponsiveGrid, whose generated names Tailwind cannot see.
const CARD_GRID = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6';

type Contact = { role: string; name?: string; phone?: string; email?: string };

const contactsOf = (player: PlayerDTO): Contact[] => [
  { role: 'Parent', name: player.parentName, phone: player.parentPhone, email: player.parentEmail },
  { role: 'Second parent', name: player.secondaryParentName, phone: player.secondaryParentPhone, email: player.secondaryParentEmail },
  { role: 'Emergency', name: player.emergencyContactName, phone: player.emergencyContactPhone }
].filter(c => c.name || c.phone || c.email);

/** Tap to call, or to email when there is no phone. */
function ContactLines({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return <p className="text-xs text-text-secondary">No family contacts on file.</p>;
  }
  return (
    <>
      {contacts.map(c => (
        <div key={c.role} className="flex items-baseline justify-between gap-2 text-sm">
          <span className="min-w-0 truncate text-text-primary">
            {c.name || '—'}
            <span className="ml-1 text-xs text-text-secondary">{c.role}</span>
          </span>
          {c.phone ? (
            <a
              href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}
              className="shrink-0 whitespace-nowrap font-medium text-primary hover:underline"
            >
              {c.phone}
            </a>
          ) : c.email ? (
            <a href={`mailto:${c.email}`} className="min-w-0 truncate text-primary hover:underline">
              {c.email}
            </a>
          ) : null}
        </div>
      ))}
    </>
  );
}

const playerMeta = (player: PlayerDTO) => {
  const age = ageOf(player.dateOfBirth);
  return [age !== null ? `Age ${age}` : null, player.level, player.position].filter(Boolean).join(' • ');
};

const coachName = (group: GroupResponse) =>
  group.coach ? `${group.coach.firstName ?? ''} ${group.coach.lastName ?? ''}`.trim() : '';

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    className={`w-4 h-4 shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
    fill="none" stroke="currentColor" viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const GroupLabel = ({ player }: { player: PlayerDTO }) =>
  player.groupName ? (
    <span className="text-text-secondary">{player.groupName}</span>
  ) : (
    <span className="font-medium text-accent-yellow">Unassigned</span>
  );

/** One player as a row; tapping it opens the family contacts. */
function PlayerRow({ player, showGroup }: { player: PlayerDTO; showGroup: boolean }) {
  const [open, setOpen] = useState(false);
  const inactive = player.isActive === false;

  return (
    <div className={inactive ? 'opacity-60' : ''}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary-50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {fullName(player)}
            {inactive && <span className="ml-2 text-xs font-normal text-accent-red">Inactive</span>}
          </p>
          <p className="text-xs text-text-secondary truncate">{playerMeta(player)}</p>
        </div>
        {showGroup && (
          <span className="shrink-0 max-w-[35%] text-right text-xs leading-tight line-clamp-2">
            <GroupLabel player={player} />
          </span>
        )}
        <Chevron open={open} />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-1">
          {inactive && player.inactiveReason && (
            <p className="text-xs text-text-secondary">Inactive: {player.inactiveReason}</p>
          )}
          <ContactLines contacts={contactsOf(player)} />
        </div>
      )}
    </div>
  );
}

function PlayerCollection({ players, mode, showGroup }: { players: PlayerDTO[]; mode: ViewMode; showGroup: boolean }) {
  return mode === 'cards' ? (
    <div className={CARD_GRID}>
      {players.map(p => <PlayerCard key={p.id} player={p} showActions={false} />)}
    </div>
  ) : (
    <div className="border border-border rounded-lg divide-y divide-border bg-white">
      {players.map(p => <PlayerRow key={p.id} player={p} showGroup={showGroup} />)}
    </div>
  );
}

const UNASSIGNED = 'unassigned';

export const ALL_GROUPS = 'all';

export function PlayersRoster({
  players,
  groups,
  groupFilter,
  onGroupFilterChange: setGroupFilter
}: {
  players: PlayerDTO[];
  groups: GroupResponse[];
  /** 'all', 'unassigned' or a group id; held by the page so a group card can set it. */
  groupFilter: string;
  onGroupFilterChange: (filter: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [mode, setMode] = useViewMode('players');

  const inactiveCount = players.filter(p => p.isActive === false).length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players
      .filter(p => showInactive || p.isActive !== false)
      .filter(p =>
        groupFilter === ALL_GROUPS ? true
          : groupFilter === UNASSIGNED ? !p.groupId
          : String(p.groupId) === groupFilter
      )
      .filter(p => !q || fullName(p).toLowerCase().includes(q) || (p.parentName ?? '').toLowerCase().includes(q))
      .sort(byName);
  }, [players, search, groupFilter, showInactive]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-lg sm:text-xl font-semibold text-text-primary">
          Players <span className="text-sm font-normal text-text-secondary">{visible.length} shown</span>
        </h2>
        <ViewToggle mode={mode} onChange={setMode} />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by player or parent name..."
          className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={groupFilter}
          onChange={e => setGroupFilter(e.target.value)}
          className="select-base sm:w-56"
        >
          <option value={ALL_GROUPS}>All groups</option>
          <option value={UNASSIGNED}>Unassigned</option>
          {[...groups].sort((a, b) => a.name.localeCompare(b.name)).map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {inactiveCount > 0 && (
        <label className="inline-flex items-center gap-2 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            className="h-4 w-4 rounded text-blue-600"
          />
          <span className="text-xs text-text-secondary">Include {inactiveCount} inactive</span>
        </label>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-10">No players match.</p>
      ) : (
        <PlayerCollection players={visible} mode={mode} showGroup={groupFilter === ALL_GROUPS} />
      )}
    </div>
  );
}

export function GroupsRoster({
  players,
  groups,
  onOpenGroup
}: {
  players: PlayerDTO[];
  groups: GroupResponse[];
  /** Cards view: show this group's players in the Players tab. */
  onOpenGroup: (groupId: number) => void;
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [mode, setMode] = useViewMode('groups');

  // Players by group, from the academy-wide list rather than a request per group.
  const playersByGroup = useMemo(() => {
    const map = new Map<number, PlayerDTO[]>();
    players.forEach(p => {
      if (!p.groupId) return;
      map.set(p.groupId, [...(map.get(p.groupId) ?? []), p]);
    });
    map.forEach(list => list.sort(byName));
    return map;
  }, [players]);

  const sorted = useMemo(
    () => [...groups].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name)),
    [groups]
  );

  if (groups.length === 0) {
    return <p className="text-sm text-text-secondary text-center py-10">No groups yet.</p>;
  }

  const members = (group: GroupResponse) => {
    const list = playersByGroup.get(group.id) ?? [];
    return list.length === 0 ? (
      <p className="text-sm text-text-secondary text-center py-6">No players in this group yet.</p>
    ) : (
      // Rows inside a card too: a card of cards is too tall to scan on a phone.
      <div className="divide-y divide-border">
        {list.map(p => <PlayerRow key={p.id} player={p} showGroup={false} />)}
      </div>
    );
  };

  const toggle = (id: number) => setOpenId(openId === id ? null : id);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-lg sm:text-xl font-semibold text-text-primary">
          Groups <span className="text-sm font-normal text-text-secondary">{groups.length}</span>
        </h2>
        <ViewToggle mode={mode} onChange={setMode} />
      </div>

      {mode === 'cards' ? (
        <>
          <p className="text-xs text-text-secondary -mt-1 mb-3">Tap a group to see its players.</p>
          <div className={CARD_GRID}>
            {sorted.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                onViewDetails={() => onOpenGroup(group.id)}
                showActions={false}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {sorted.map(group => {
            const open = openId === group.id;
            const coach = coachName(group);
            return (
              <div key={group.id} className={`bg-white border border-border rounded-lg ${group.isActive ? '' : 'opacity-60'}`}>
                <button
                  type="button"
                  onClick={() => toggle(group.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary-50 transition-colors rounded-lg"
                  aria-expanded={open}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {group.name}
                      {!group.isActive && <span className="ml-2 text-xs font-normal text-text-secondary">Inactive</span>}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {group.level} • {group.ageGroup} • {coach ? `Coach ${coach}` : 'No coach'}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-medium ${group.currentPlayerCount > group.capacity ? 'text-accent-red' : 'text-text-primary'}`}>
                    {group.currentPlayerCount}/{group.capacity}
                  </span>
                  <Chevron open={open} />
                </button>
                {open && <div className="border-t border-border">{members(group)}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
