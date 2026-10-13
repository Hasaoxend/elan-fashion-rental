'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Save, Settings } from 'lucide-react';
import { getSettings, saveSetting } from '@/lib/api';
import { useToast } from '@/components/toast';
import { SETTING_GROUP_LABELS, SETTING_LABELS } from '@/lib/labels';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSettings();
      setSettings(result.items);
      const initial: Record<string, string> = {};
      for (const item of result.items) initial[item.key] = item.value;
      setForm(initial);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Không thể tải cấu hình.');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      for (const item of settings) {
        if (form[item.key] !== item.value) {
          await saveSetting(item.key, form[item.key] ?? '', item.group);
        }
      }
      toast('success', 'Lưu cấu hình thành công.');
      load();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Không thể lưu cấu hình.');
    } finally { setSaving(false); }
  };

  const groups = [...new Set(settings.map((s) => s.group))];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Cấu hình</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Thông tin cửa hàng (tên, địa chỉ, liên hệ, giới thiệu) hiển thị trên website, chính sách thuê và thanh toán.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} title="Tải lại" aria-label="Tải lại" className="p-3 bg-white border border-[#E5E3DF] rounded-lg hover:border-[#171717]"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] disabled:opacity-40 transition">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu thay đổi
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C89B6D]" /></div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group} className="bg-white border border-[#E5E3DF] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E5E3DF] flex items-center gap-3">
                <Settings className="w-4 h-4 text-[#C89B6D]" />
                <h2 className="font-semibold">{SETTING_GROUP_LABELS[group] || group}</h2>
              </div>
              <div className="p-6 space-y-4">
                {settings.filter((s) => s.group === group).map((item) => (
                  <label key={item.key} className="block text-sm">
                    <span className="text-[#6B6B6B]">{SETTING_LABELS[item.key] || item.key}</span>
                    {item.key === 'store.about' ? (
                      <textarea
                        value={form[item.key] ?? ''}
                        onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                        rows={6}
                        className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]"
                      />
                    ) : (
                      <input
                        value={form[item.key] ?? ''}
                        onChange={(e) => setForm({ ...form, [item.key]: e.target.value })}
                        className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]"
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
