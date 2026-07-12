import React, { useState, useEffect } from 'react';
import { getSystemSettings, updateSystemSetting } from '../api/systemSettings';
import type { SystemSettingDto } from '../api/systemSettings';
import {
  TbSettings,
  TbCheck,
  TbLoader,
  TbInfoCircle,
  TbCoins
} from 'react-icons/tb';
import { toast } from '../utils/toast';

export const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettingDto[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Track local edits per setting ID
  const [localValues, setLocalValues] = useState<{ [id: string]: string }>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // Track validation error messages per setting ID
  const [validationErrors, setValidationErrors] = useState<{ [id: string]: string }>({});

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await getSystemSettings();
      if (res.data && res.data.success && res.data.data) {
        const list = res.data.data;
        setSettings(list);
        
        // Initialize local values
        const values: { [id: string]: string } = {};
        list.forEach((s) => {
          values[s.id] = s.settingValue;
        });
        setLocalValues(values);
        setValidationErrors({});
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
      toast.error('Lỗi tải cấu hình', 'Không thể lấy thông tin cấu hình hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleValueChange = (id: string, key: string, val: string) => {
    setLocalValues((prev) => ({ ...prev, [id]: val }));
    
    // Validate value based on key
    if (key === 'bonus_coins') {
      const num = Number(val.trim());
      if (val.trim() === '') {
        setValidationErrors((prev) => ({ ...prev, [id]: 'Giá trị không được để trống' }));
      } else if (isNaN(num) || !Number.isInteger(num) || num < 0) {
        setValidationErrors((prev) => ({ ...prev, [id]: 'Tỷ lệ thưởng xu phải là số nguyên không âm (>= 0)' }));
      } else {
        setValidationErrors((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
      }
    }
  };

  const handleSaveSetting = async (setting: SystemSettingDto) => {
    const val = localValues[setting.id] || '';
    
    // Final check
    if (validationErrors[setting.id]) {
      toast.error('Dữ liệu không hợp lệ', validationErrors[setting.id]);
      return;
    }

    setSavingId(setting.id);
    try {
      const res = await updateSystemSetting(setting.id, val.trim());
      if (res.data && res.data.success) {
        toast.success('Cập nhật thành công', `Đã lưu cấu hình "${getSettingFriendlyName(setting.settingKey)}" mới.`);
        loadSettings();
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi lưu cấu hình', error.response?.data?.message || 'Không thể cập nhật cấu hình này.');
    } finally {
      setSavingId(null);
    }
  };

  const getSettingFriendlyName = (key: string) => {
    switch (key) {
      case 'bonus_coins': return 'Tỷ lệ quy đổi xu thưởng (Bonus Coins)';
      default: return key;
    }
  };

  const getSettingIcon = (key: string) => {
    switch (key) {
      case 'bonus_coins': return <TbCoins style={{ color: 'var(--primary)', fontSize: '24px' }} />;
      default: return <TbSettings style={{ color: 'var(--primary)', fontSize: '24px' }} />;
    }
  };

  return (
    <div className="system-settings-view fade-in">
      <div className="view-header" style={{ marginBottom: '28px' }}>
        <div>
          <h1 className="view-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TbSettings style={{ color: 'var(--primary)' }} /> Cấu hình hệ thống
          </h1>
          <p className="view-subtitle" style={{ margin: 0, marginTop: '4px' }}>
            Quản lý các thông số thiết lập nghiệp vụ cốt lõi đang hoạt động trên hệ thống InkPulse.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="pink-spinner-container" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="pink-spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
          {settings.length > 0 ? (
            settings.map((s) => {
              const hasError = !!validationErrors[s.id];
              const isEdited = s.settingValue !== localValues[s.id];
              const isSaving = savingId === s.id;

              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    paddingBottom: '32px',
                    borderBottom: '1px solid var(--border)',
                    position: 'relative'
                  }}
                >
                  {/* Setting Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getSettingIcon(s.settingKey)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                        {getSettingFriendlyName(s.settingKey)}
                      </h3>
                    </div>
                  </div>

                  {/* Setting Description */}
                  <div style={{
                    fontSize: '13.5px',
                    color: 'var(--text-muted)',
                    lineHeight: '1.6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingLeft: '4px'
                  }}>
                    <TbInfoCircle style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span>{s.description}</span>
                  </div>

                  {/* Setting Edit Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    marginTop: '4px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <input
                        type="text"
                        value={localValues[s.id] || ''}
                        onChange={(e) => handleValueChange(s.id, s.settingKey, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          backgroundColor: '#0d0d0f',
                          border: hasError ? '1px solid #F56565' : '1px solid var(--border)',
                          color: '#ffffff',
                          fontSize: '15px',
                          fontWeight: 'bold',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        disabled={isSaving}
                      />
                      {hasError && (
                        <div style={{ color: '#F56565', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>
                          {validationErrors[s.id]}
                        </div>
                      )}
                    </div>

                    <button
                      className="btn-primary"
                      onClick={() => handleSaveSetting(s)}
                      disabled={isSaving || hasError || !isEdited}
                      style={{
                        padding: '0 16px',
                        fontSize: '13px',
                        height: '36px',
                        opacity: (!isEdited || hasError) && !isSaving ? 0.5 : 1,
                        cursor: (!isEdited || hasError) && !isSaving ? 'not-allowed' : 'pointer',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {isSaving ? (
                        <TbLoader className="animate-spin-custom" style={{ fontSize: '16px' }} />
                      ) : (
                        <TbCheck style={{ fontSize: '16px' }} />
                      )}
                      Lưu cấu hình
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-light)', border: '1px dashed var(--border)' }}>
              Không tìm thấy cấu hình hệ thống nào.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
