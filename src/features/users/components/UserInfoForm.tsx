import { useState } from 'react';

export interface UserInfoData {
  fullName: string;
  fullNameKana: string;
  postalCode: string;
  prefecture: string;
  city: string;
  address: string;
  phoneNumber: string;
  birthDate: string;
  paymentMethod: 'credit' | 'bank';
  creditCardNumber?: string;
  creditCardExpiry?: string;
  creditCardCvv?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountType?: 'savings' | 'checking';
  bankAccountNumber?: string;
}

interface Props {
  title: string;
  description: string;
  onSubmit: (data: UserInfoData) => void;
  onCancel: () => void;
  submitButtonText?: string;
}

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

export const UserInfoForm = ({ title, description, onSubmit, onCancel, submitButtonText = '確認' }: Props) => {
  const [formData, setFormData] = useState<UserInfoData>({
    fullName: '',
    fullNameKana: '',
    postalCode: '',
    prefecture: '',
    city: '',
    address: '',
    phoneNumber: '',
    birthDate: '',
    paymentMethod: 'credit',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = '本名（漢字）を入力してください';
    if (!formData.fullNameKana.trim()) newErrors.fullNameKana = '本名（カナ）を入力してください';
    if (!formData.fullNameKana.match(/^[ァ-ヶー\s]+$/)) newErrors.fullNameKana = 'カタカナで入力してください';
    if (!formData.postalCode.match(/^\d{7}$/)) newErrors.postalCode = '郵便番号は7桁の数字で入力してください';
    if (!formData.prefecture) newErrors.prefecture = '都道府県を選択してください';
    if (!formData.city.trim()) newErrors.city = '市区町村を入力してください';
    if (!formData.address.trim()) newErrors.address = '番地を入力してください';
    if (!formData.phoneNumber.match(/^0\d{9,10}$/)) newErrors.phoneNumber = '電話番号を正しく入力してください';
    if (!formData.birthDate) newErrors.birthDate = '生年月日を入力してください';

    // 年齢確認（18歳以上）
    if (formData.birthDate) {
      const birthYear = new Date(formData.birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      if (currentYear - birthYear < 18) {
        newErrors.birthDate = '18歳以上の方のみご利用いただけます';
      }
    }

    if (formData.paymentMethod === 'credit') {
      if (!formData.creditCardNumber?.match(/^\d{16}$/)) {
        newErrors.creditCardNumber = 'カード番号は16桁で入力してください';
      }
      if (!formData.creditCardExpiry?.match(/^\d{2}\/\d{2}$/)) {
        newErrors.creditCardExpiry = '有効期限をMM/YY形式で入力してください';
      }
      if (!formData.creditCardCvv?.match(/^\d{3,4}$/)) {
        newErrors.creditCardCvv = 'セキュリティコードを入力してください';
      }
    } else {
      if (!formData.bankName?.trim()) newErrors.bankName = '銀行名を入力してください';
      if (!formData.bankBranch?.trim()) newErrors.bankBranch = '支店名を入力してください';
      if (!formData.bankAccountType) newErrors.bankAccountType = '口座種別を選択してください';
      if (!formData.bankAccountNumber?.match(/^\d{7}$/)) {
        newErrors.bankAccountNumber = '口座番号は7桁で入力してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof UserInfoData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full my-8">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-gray-600 mt-2">{description}</p>
          <p className="text-xs text-red-600 mt-2">※ 入力された情報は厳重に管理され、取引以外の目的で使用されることはありません</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* 本人情報 */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">👤 本人情報</h3>
            
            <div>
              <label className="block text-sm font-semibold mb-1">本名（漢字）<span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="山田 太郎"
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">本名（カナ）<span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.fullNameKana}
                onChange={(e) => handleChange('fullNameKana', e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="ヤマダ タロウ"
              />
              {errors.fullNameKana && <p className="text-red-500 text-xs mt-1">{errors.fullNameKana}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">生年月日<span className="text-red-500">*</span></label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
              {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">電話番号<span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="09012345678"
              />
              <p className="text-xs text-gray-500 mt-1">ハイフンなしで入力してください（SMS認証に使用）</p>
              {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
            </div>
          </div>

          {/* 配送先住所 */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">📦 配送先住所</h3>
            
            <div>
              <label className="block text-sm font-semibold mb-1">郵便番号<span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="1234567"
                maxLength={7}
              />
              {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">都道府県<span className="text-red-500">*</span></label>
              <select
                value={formData.prefecture}
                onChange={(e) => handleChange('prefecture', e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {PREFECTURES.map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
              {errors.prefecture && <p className="text-red-500 text-xs mt-1">{errors.prefecture}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">市区町村<span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="渋谷区"
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">番地・建物名<span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="道玄坂1-2-3 ○○ビル101"
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>
          </div>

          {/* 支払い情報 */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">💳 支払い情報</h3>
            
            <div>
              <label className="block text-sm font-semibold mb-2">支払い方法<span className="text-red-500">*</span></label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="credit"
                    checked={formData.paymentMethod === 'credit'}
                    onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  />
                  <span>クレジットカード</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="bank"
                    checked={formData.paymentMethod === 'bank'}
                    onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  />
                  <span>銀行口座</span>
                </label>
              </div>
            </div>

            {formData.paymentMethod === 'credit' ? (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-1">カード番号<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.creditCardNumber || ''}
                    onChange={(e) => handleChange('creditCardNumber', e.target.value.replace(/\D/g, ''))}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="1234567890123456"
                    maxLength={16}
                  />
                  {errors.creditCardNumber && <p className="text-red-500 text-xs mt-1">{errors.creditCardNumber}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">有効期限<span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.creditCardExpiry || ''}
                      onChange={(e) => handleChange('creditCardExpiry', e.target.value)}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                    {errors.creditCardExpiry && <p className="text-red-500 text-xs mt-1">{errors.creditCardExpiry}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">CVV<span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData.creditCardCvv || ''}
                      onChange={(e) => handleChange('creditCardCvv', e.target.value.replace(/\D/g, ''))}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="123"
                      maxLength={4}
                    />
                    {errors.creditCardCvv && <p className="text-red-500 text-xs mt-1">{errors.creditCardCvv}</p>}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-1">銀行名<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.bankName || ''}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="○○銀行"
                  />
                  {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">支店名<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.bankBranch || ''}
                    onChange={(e) => handleChange('bankBranch', e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="渋谷支店"
                  />
                  {errors.bankBranch && <p className="text-red-500 text-xs mt-1">{errors.bankBranch}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">口座種別<span className="text-red-500">*</span></label>
                  <select
                    value={formData.bankAccountType || ''}
                    onChange={(e) => handleChange('bankAccountType', e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    <option value="savings">普通</option>
                    <option value="checking">当座</option>
                  </select>
                  {errors.bankAccountType && <p className="text-red-500 text-xs mt-1">{errors.bankAccountType}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">口座番号<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber || ''}
                    onChange={(e) => handleChange('bankAccountNumber', e.target.value.replace(/\D/g, ''))}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="1234567"
                    maxLength={7}
                  />
                  {errors.bankAccountNumber && <p className="text-red-500 text-xs mt-1">{errors.bankAccountNumber}</p>}
                </div>
              </>
            )}
          </div>
        </form>

        <div className="p-6 border-t flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            {submitButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
