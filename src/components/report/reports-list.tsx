import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { LibraryEmptyState } from "@/components/report/library-empty-state";
import { ReportCard } from "@/components/report/report-card";
import { Reveal } from "@/components/motion/reveal";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReportLibrary } from "@/hooks/use-report-library";
import { REPORT_SORTS, type ReportSort } from "@/lib/reports/types";

/**
 * Searchable, sortable grid of saved reports.
 * Shared by history and favourites so neither view duplicates list logic.
 */
export function ReportsList({
  favoritesOnly = false,
  emptyTitle,
  emptyDescription,
}: {
  favoritesOnly?: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ReportSort>("newest");

  const { entries, isEmpty, onToggleFavorite, onDelete } = useReportLibrary({
    search,
    sort,
    favoritesOnly,
  });

  const noneVisible = useMemo(() => entries.length === 0, [entries]);

  if (isEmpty) {
    return <LibraryEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search reports by name or address"
            aria-label="Search reports"
            className="min-h-12 rounded-full pl-10"
          />
        </div>

        <Select value={sort} onValueChange={(value) => setSort(value as ReportSort)}>
          <SelectTrigger aria-label="Sort reports" className="min-h-12 w-full rounded-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_SORTS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {noneVisible ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No reports match that search. Try a different name or address.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry, index) => (
            <Reveal key={entry.id} delay={(index % 3) * 90} className="h-full">
              <ReportCard
                entry={entry}
                onToggleFavorite={onToggleFavorite}
                onDelete={onDelete}
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
