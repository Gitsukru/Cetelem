# Supabase RLS Deployment Guide

Bu belge, Zikirmatik uygulamasinin Supabase Row Level Security (RLS) politikalarinin nasil deploy edilecegini aciklar.

## Neden Onemli?

Mevcut RLS politikalari cok gevsek ve asagidaki riskleri tasir:
- Herhangi bir kullanici baskasinin skorunu degistirebilir
- Herhangi bir kullanici herhangi bir grubun liderlik tablosuna erisebilir
- Herhangi bir kullanici herhangi bir mesaji silebilir

## Deployment Adimlari

### Adim 1: Supabase Dashboard'a Giris

1. https://supabase.com/dashboard adresine gidin
2. Projenizi secin
3. Sol menuden **SQL Editor** secin

### Adim 2: Mevcut Politikalari Kontrol Edin

Asagidaki SQL'i calistirarak mevcut politikalari gorun:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Adim 3: Yeni RLS Politikalarini Uygulama

1. `supabase/secure-rls-policies.sql` dosyasinin tum icerigini kopyalayin
2. SQL Editor'de yeni bir sorgu olusturun
3. Kopyaladiginiz SQL'i yapisitirin
4. **Run** butonuna tiklayin

### Adim 4: Dogrulama

Politikalarin basariyla uygulandigini dogrulamak icin:

```sql
-- Tum politikalari listele
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public';

-- RLS'in aktif oldugunu dogrula
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

## Uygulanan Guvenlik Politikalari

### Groups Tablosu
- **SELECT**: Herkese acik (grup kodunu bilen erisebilir)
- **INSERT**: Rate limited (saatte max 10 grup)
- **UPDATE**: Devre disi (gruplar degistirilemez)
- **DELETE**: Devre disi (gruplar silinemez)

### Participants Tablosu
- **SELECT**: Herkese acik (liderlik tablosu icin)
- **INSERT**: Herkese acik (gruba katilim icin)
- **UPDATE**: Herkese acik (skor guncelleme icin)
- **DELETE**: Herkese acik (gruptan ayrilma icin)

### Device Backups Tablosu
- **SELECT**: Sadece backup kodu ile (kod gerekli)
- **INSERT**: Rate limited (saatte max 5 backup)
- **UPDATE**: Devre disi
- **DELETE**: Sadece 30 gunluk eski kayitlar

### Analytics Events Tablosu
- **SELECT**: Devre disi (privacy)
- **INSERT**: Rate limited (saatte max 100 event)

### Category Notes Tablosu
- **SELECT**: Herkese acik
- **INSERT**: Rate limited
- **UPDATE/DELETE**: Herkese acik

## Geri Alma (Rollback)

Eger bir sorun olusursa, eski politikalara geri donmek icin:

```sql
-- supabase/rls-policies.sql dosyasini calistirin
-- Bu daha gevsek politikalari geri yukler
```

## Test Etme

Politikalarin dogru calistigini test etmek icin:

1. Uygulamayi acin
2. Yeni bir grup olusturun
3. Gruba katilin
4. Skor guncelleyin
5. Liderlik tablosunu kontrol edin

Eger herhangi bir islem basarisiz olursa, Supabase Dashboard'da **Logs > API** bolumunden hatalari inceleyin.

## Onemli Notlar

- Bu politikalar anonim (kimlik dogrulamasi olmayan) kullanim icin tasarlanmistir
- Rate limiting sunucu tarafinda (Supabase) uygulanir ve bypass edilemez
- Client-side rate limiting ek bir koruma katmanidir

## Iletisim

Sorunlar icin:
- GitHub Issues: https://github.com/anthropics/claude-code/issues
- Supabase Docs: https://supabase.com/docs/guides/auth/row-level-security
