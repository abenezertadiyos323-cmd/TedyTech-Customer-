import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  _id: string;
  phoneType?: string | null;
  brand?: string | null;
  model?: string | null;
  storage?: number | null;
  condition?: string | null;
  price: number;
  images?: string[];
  mainImageUrl?: string | null;
  exchange_available?: boolean | null;
}

interface SearchResultsDropdownProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
  onSelectResult: (result: SearchResult) => void;
}

export function SearchResultsDropdown({
  results,
  isLoading,
  query,
  onSelectResult,
}: SearchResultsDropdownProps) {
  const shouldShow = query.length >= 2;

  if (!shouldShow) return null;

  const buildTitle = (result: SearchResult): string => {
    if (result.phoneType) return result.phoneType;
    if (result.brand || result.model) {
      return [result.brand, result.model].filter(Boolean).join(" ");
    }
    return "Phone";
  };

  const getImageUrl = (result: SearchResult): string => {
    return result.mainImageUrl || "/placeholder.svg";
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl border border-border shadow-lg z-50 overflow-hidden animate-fade-in max-h-96 overflow-y-auto">
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Searching...</span>
        </div>
      )}

      {!isLoading && results.length === 0 && (
        <div className="p-6 text-center text-muted-foreground">
          <p className="text-sm">No phones found</p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="divide-y divide-border">
          {results.slice(0, 8).map((result) => {
            const title = buildTitle(result);
            const imageUrl = getImageUrl(result);

            return (
              <button
                key={result._id}
                onClick={() => onSelectResult(result)}
                className="w-full p-3 flex gap-3 items-center hover:bg-muted transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground line-clamp-1">
                    {title}
                    {result.storage && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {result.storage}GB
                      </Badge>
                    )}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {result.condition && (
                      <span className="text-xs text-muted-foreground capitalize">
                        {result.condition}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-foreground mt-1">
                    {result.price.toLocaleString()} Birr
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
