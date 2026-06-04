import { describe, it, expect } from 'vitest';
import {
  createReportSchema,
  updateReportStatusSchema,
  reportRatingSchema,
} from '../report.validator.js';

// ─── createReportSchema ───────────────────────────────────────────────────────

describe('createReportSchema', () => {
  const valid = {
    body: {
      category: 'JALAN',
      damage_level: 'SEDANG',
      description: 'Jalan berlubang besar',
      latitude: -8.1654,
      longitude: 112.6208,
      address: 'Jl. Raya Malang No. 1',
      district: 'Kepanjen',
    },
  };

  it('lolos untuk input valid lengkap', () => {
    expect(() => createReportSchema.parse(valid)).not.toThrow();
  });

  it('lolos tanpa description (opsional)', () => {
    const { description, ...rest } = valid.body;
    expect(() => createReportSchema.parse({ body: rest })).not.toThrow();
  });

  it('gagal jika category tidak valid', () => {
    const data = { body: { ...valid.body, category: 'JEMBATAN_RUSAK' } };
    expect(() => createReportSchema.parse(data)).toThrow('Kategori fasilitas tidak valid');
  });

  it('menerima semua 7 kategori yang valid', () => {
    const categories = ['JALAN', 'JEMBATAN', 'DRAINASE', 'LAMPU_JALAN', 'TAMAN', 'FASILITAS_OLAHRAGA', 'LAINNYA'];
    for (const category of categories) {
      expect(() => createReportSchema.parse({ body: { ...valid.body, category } })).not.toThrow();
    }
  });

  it('gagal jika damage_level tidak valid', () => {
    const data = { body: { ...valid.body, damage_level: 'PARAH' } };
    expect(() => createReportSchema.parse(data)).toThrow('Tingkat kerusakan tidak valid');
  });

  it('menerima semua 3 tingkat kerusakan', () => {
    for (const level of ['RINGAN', 'SEDANG', 'BERAT']) {
      expect(() => createReportSchema.parse({ body: { ...valid.body, damage_level: level } })).not.toThrow();
    }
  });

  it('gagal jika description lebih dari 500 karakter', () => {
    const data = { body: { ...valid.body, description: 'x'.repeat(501) } };
    expect(() => createReportSchema.parse(data)).toThrow('500 karakter');
  });

  it('gagal jika latitude di luar wilayah Malang (terlalu selatan)', () => {
    const data = { body: { ...valid.body, latitude: -9.5 } };
    expect(() => createReportSchema.parse(data)).toThrow('Kabupaten Malang');
  });

  it('gagal jika latitude di luar wilayah Malang (terlalu utara)', () => {
    const data = { body: { ...valid.body, latitude: -6.0 } };
    expect(() => createReportSchema.parse(data)).toThrow('Kabupaten Malang');
  });

  it('gagal jika longitude di luar wilayah Malang', () => {
    const data = { body: { ...valid.body, longitude: 110.0 } };
    expect(() => createReportSchema.parse(data)).toThrow('Kabupaten Malang');
  });

  it('coerces latitude/longitude dari string ke number', () => {
    const data = { body: { ...valid.body, latitude: '-8.1654', longitude: '112.6208' } };
    const result = createReportSchema.parse(data);
    expect(typeof result.body.latitude).toBe('number');
    expect(typeof result.body.longitude).toBe('number');
  });

  it('gagal jika address terlalu pendek', () => {
    const data = { body: { ...valid.body, address: 'Jl' } };
    expect(() => createReportSchema.parse(data)).toThrow('5 karakter');
  });

  it('gagal jika district terlalu pendek', () => {
    const data = { body: { ...valid.body, district: 'AB' } };
    expect(() => createReportSchema.parse(data)).toThrow('Nama kecamatan wajib diisi');
  });
});

// ─── updateReportStatusSchema ─────────────────────────────────────────────────

describe('updateReportStatusSchema', () => {
  it('lolos untuk status IN_PROGRESS dengan note', () => {
    const data = { body: { status: 'IN_PROGRESS', note: 'Sedang ditangani' } };
    expect(() => updateReportStatusSchema.parse(data)).not.toThrow();
  });

  it('lolos untuk status RESOLVED tanpa note', () => {
    const data = { body: { status: 'RESOLVED' } };
    expect(() => updateReportStatusSchema.parse(data)).not.toThrow();
  });

  it('lolos untuk REJECTED dengan rejection_reason', () => {
    const data = {
      body: {
        status: 'REJECTED',
        rejection_reason: 'Laporan tidak sesuai dengan kerusakan fasilitas publik yang ada.',
      },
    };
    expect(() => updateReportStatusSchema.parse(data)).not.toThrow();
  });

  it('gagal jika status tidak valid', () => {
    const data = { body: { status: 'DIPROSES' } };
    expect(() => updateReportStatusSchema.parse(data)).toThrow('Status tidak valid');
  });

  it('gagal jika rejection_reason kurang dari 20 karakter', () => {
    const data = { body: { status: 'REJECTED', rejection_reason: 'Terlalu singkat' } };
    expect(() => updateReportStatusSchema.parse(data)).toThrow();
  });

  it('gagal jika note lebih dari 200 karakter', () => {
    const data = { body: { status: 'IN_PROGRESS', note: 'x'.repeat(201) } };
    expect(() => updateReportStatusSchema.parse(data)).toThrow('200 karakter');
  });
});

// ─── reportRatingSchema ───────────────────────────────────────────────────────

describe('reportRatingSchema', () => {
  it('lolos untuk rating valid dengan komentar', () => {
    const data = { body: { score: 5, comment: 'Penanganan cepat!' } };
    expect(() => reportRatingSchema.parse(data)).not.toThrow();
  });

  it('lolos untuk rating valid tanpa komentar', () => {
    const data = { body: { score: 3 } };
    expect(() => reportRatingSchema.parse(data)).not.toThrow();
  });

  it('menerima semua score 1-5', () => {
    for (let score = 1; score <= 5; score++) {
      expect(() => reportRatingSchema.parse({ body: { score } })).not.toThrow();
    }
  });

  it('gagal jika score 0', () => {
    expect(() => reportRatingSchema.parse({ body: { score: 0 } })).toThrow('minimal 1');
  });

  it('gagal jika score 6', () => {
    expect(() => reportRatingSchema.parse({ body: { score: 6 } })).toThrow('maksimal 5');
  });

  it('coerces score dari string ke number', () => {
    const result = reportRatingSchema.parse({ body: { score: '4' } });
    expect(typeof result.body.score).toBe('number');
  });

  it('gagal jika komentar lebih dari 200 karakter', () => {
    const data = { body: { score: 5, comment: 'x'.repeat(201) } };
    expect(() => reportRatingSchema.parse(data)).toThrow('200 karakter');
  });
});
