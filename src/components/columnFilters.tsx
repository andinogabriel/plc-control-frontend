import { useEffect, useState, type ReactNode } from 'react';
import {
  Box, Button, IconButton, MenuItem, Popover, Stack, TextField, Typography,
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { type Dayjs } from 'dayjs';

/**
 * Shared shell for per-column filter popovers: the column title plus a filter icon that opens
 * a popover with the given inputs and "Aplicar"/"Limpiar" actions. The draft state lives in
 * each specific header component; this only owns the popover open/close.
 */
function FilterShell({ label, active, canApply, disabled, onApply, onClear, children }: {
  label: string; active: boolean; canApply: boolean; disabled?: boolean;
  onApply: () => void; onClear: () => void; children: ReactNode;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);
  return (
    <Stack direction="row" alignItems="center" spacing={0} sx={{ width: '100%' }}>
      <Box component="span" sx={{ fontWeight: 700, flexGrow: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </Box>
      <IconButton size="small" disabled={disabled} onClick={(e) => setAnchor(e.currentTarget)}
        aria-label={`Filtrar ${label}`} sx={{ p: 0.25, ml: 0.25, flexShrink: 0 }}>
        <FilterAltIcon sx={{ fontSize: 16 }} color={active ? 'primary' : 'disabled'} />
      </IconButton>
      <Popover
        open={Boolean(anchor)} anchorEl={anchor} onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 280 }}>
          {children}
          <Stack direction="row" justifyContent="flex-end" spacing={1} mt={2}>
            <Button size="small" onClick={() => { onClear(); close(); }}>Limpiar</Button>
            <Button size="small" variant="contained" disabled={!canApply} onClick={() => { onApply(); close(); }}>
              Aplicar
            </Button>
          </Stack>
        </Box>
      </Popover>
    </Stack>
  );
}

export function TextFilterHeader({ label, value, onApply, disabled }: {
  label: string; value: string; disabled?: boolean; onApply: (value: string | undefined) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const trimmed = draft.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < 3;
  // Require at least 3 letters so the backend "contains" search receives a meaningful term.
  const canApply = trimmed.length >= 3 && trimmed !== value;
  return (
    <FilterShell label={label} active={Boolean(value)} canApply={canApply} disabled={disabled}
      onApply={() => onApply(trimmed)} onClear={() => { setDraft(''); onApply(undefined); }}>
      <TextField autoFocus size="small" fullWidth label={label} value={draft}
        onChange={(e) => setDraft(e.target.value)} error={tooShort}
        helperText={tooShort ? 'Escribí al menos 3 letras' : 'Mínimo 3 letras'} />
    </FilterShell>
  );
}

export function NumberFilterHeader({ label, value, onApply, min, max, disabled }: {
  label: string; value: string; disabled?: boolean; onApply: (value: string | undefined) => void; min: number; max: number;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const num = Number(draft);
  const valid = draft === '' || (!Number.isNaN(num) && num >= min && num <= max);
  return (
    <FilterShell label={label} active={Boolean(value)} canApply={valid && draft !== '' && draft !== value} disabled={disabled}
      onApply={() => onApply(draft === '' ? undefined : String(num))}
      onClear={() => { setDraft(''); onApply(undefined); }}>
      <TextField autoFocus size="small" fullWidth type="number" label="Igual a" value={draft}
        onChange={(e) => setDraft(e.target.value)} error={!valid}
        helperText={!valid ? `Debe estar entre ${min} y ${max}` : ' '} inputProps={{ step: 'any' }} />
    </FilterShell>
  );
}

export function NumberRangeFilterHeader({ label, min, max, onApply, lo, hi, disabled }: {
  label: string; min: string; max: string; lo: number; hi: number; disabled?: boolean;
  onApply: (min: string | undefined, max: string | undefined) => void;
}) {
  const [dMin, setDMin] = useState(min);
  const [dMax, setDMax] = useState(max);
  useEffect(() => { setDMin(min); setDMax(max); }, [min, max]);

  const nMin = Number(dMin);
  const nMax = Number(dMax);
  const minOk = dMin === '' || (!Number.isNaN(nMin) && nMin >= lo && nMin <= hi);
  const maxOk = dMax === '' || (!Number.isNaN(nMax) && nMax >= lo && nMax <= hi);
  const rangeOk = !(dMin !== '' && dMax !== '') || nMin <= nMax;
  const changed = dMin !== min || dMax !== max;
  const canApply = minOk && maxOk && rangeOk && changed && (dMin !== '' || dMax !== '');

  return (
    <FilterShell label={label} active={Boolean(min) || Boolean(max)} canApply={canApply} disabled={disabled}
      onApply={() => onApply(dMin === '' ? undefined : String(nMin), dMax === '' ? undefined : String(nMax))}
      onClear={() => { setDMin(''); setDMax(''); onApply(undefined, undefined); }}>
      <Stack spacing={1.5}>
        <TextField autoFocus size="small" type="number" label="Mín" value={dMin}
          onChange={(e) => setDMin(e.target.value)} error={!minOk || !rangeOk} inputProps={{ step: 'any' }} />
        <TextField size="small" type="number" label="Máx" value={dMax}
          onChange={(e) => setDMax(e.target.value)} error={!maxOk || !rangeOk} inputProps={{ step: 'any' }} />
        {!rangeOk && <Typography variant="caption" color="error">Mín debe ser ≤ Máx</Typography>}
        <Typography variant="caption" color="text.secondary">Rango permitido: {lo} a {hi}</Typography>
      </Stack>
    </FilterShell>
  );
}

export function DateRangeFilterHeader({ label, from, to, onApply, disabled }: {
  label: string; from: string; to: string; disabled?: boolean;
  onApply: (from: string | undefined, to: string | undefined) => void;
}) {
  const [dFrom, setDFrom] = useState<Dayjs | null>(from ? dayjs(from) : null);
  const [dTo, setDTo] = useState<Dayjs | null>(to ? dayjs(to) : null);
  useEffect(() => {
    setDFrom(from ? dayjs(from) : null);
    setDTo(to ? dayjs(to) : null);
  }, [from, to]);

  const valid = (!dFrom || dFrom.isValid()) && (!dTo || dTo.isValid()) && (!(dFrom && dTo) || !dFrom.isAfter(dTo));
  const canApply = valid && Boolean(dFrom || dTo);

  return (
    <FilterShell label={label} active={Boolean(from) || Boolean(to)} canApply={canApply} disabled={disabled}
      onApply={() => onApply(dFrom ? dFrom.toISOString() : undefined, dTo ? dTo.toISOString() : undefined)}
      onClear={() => { setDFrom(null); setDTo(null); onApply(undefined, undefined); }}>
      <Stack spacing={1.5}>
        <DateTimePicker label="Desde" value={dFrom} onChange={setDFrom} maxDateTime={dTo ?? undefined}
          slotProps={{ textField: { size: 'small', fullWidth: true } }} />
        <DateTimePicker label="Hasta" value={dTo} onChange={setDTo} minDateTime={dFrom ?? undefined}
          slotProps={{ textField: { size: 'small', fullWidth: true } }} />
      </Stack>
    </FilterShell>
  );
}

export function SelectFilterHeader({ label, value, options, onApply, disabled }: {
  label: string; value: string; options: { value: string; label: string }[]; disabled?: boolean;
  onApply: (value: string | undefined) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <FilterShell label={label} active={Boolean(value)} canApply={draft !== value} disabled={disabled}
      onApply={() => onApply(draft || undefined)} onClear={() => { setDraft(''); onApply(undefined); }}>
      <TextField select autoFocus size="small" fullWidth label={label} value={draft}
        onChange={(e) => setDraft(e.target.value)}>
        <MenuItem value="">(Todos)</MenuItem>
        {options.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
      </TextField>
    </FilterShell>
  );
}
