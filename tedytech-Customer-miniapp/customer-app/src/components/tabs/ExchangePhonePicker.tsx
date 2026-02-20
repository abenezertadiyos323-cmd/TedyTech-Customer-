// This module is intentionally kept separate from ExchangeTab.tsx.
// It carries cmdk (via command.tsx) so that the heavy library is NOT part of
// the initial ExchangeTab parse cost. It is pre-warmed at module scope inside
// ExchangeTab so the chunk arrives before the user can open the dropdown.
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Phone } from '@/types/phone';

interface ExchangePhonePickerProps {
  phones: Phone[];
  phonesLoading: boolean;
  selectedPhoneId: string;
  onSelect: (id: string) => void;
}

export function ExchangePhonePicker({
  phones,
  phonesLoading,
  selectedPhoneId,
  onSelect,
}: ExchangePhonePickerProps) {
  return (
    <Command className="bg-popover">
      <CommandInput placeholder="Search phones..." className="h-9 text-sm" />
      <CommandList className="max-h-60">
        <CommandEmpty>
          {phonesLoading ? 'Loading...' : 'No phones found.'}
        </CommandEmpty>
        <CommandGroup>
          {phones.map((phone) => {
            const label = `${phone.brand} ${phone.model}${phone.storage_gb ? ` ${phone.storage_gb}GB` : ''}`;
            return (
              <CommandItem
                key={phone.id}
                value={label}
                onSelect={() => onSelect(phone.id)}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    selectedPhoneId === phone.id ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
