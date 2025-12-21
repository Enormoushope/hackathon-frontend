import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ListingFormData, GradingInfo, ShippingSettings } from '../types/listing';
import { createListing } from '../api/listingApi';
import { analyzeImage } from '../api/analyzeImage';
import { suggestPrice, suggestDescription, suggestRiskAssessment } from '@/lib/gemini';
import { UserInfoForm, type UserInfoData } from '@/features/users/components/UserInfoForm';
import { CLASSIFICATION_TREE, type CategoryNode } from '@/features/items/types/classification';

const CATEGORY_TREE: CategoryNode[] = CLASSIFICATION_TREE;
const DEFAULT_CATEGORY_ID = CATEGORY_TREE[0].children![0].code;

const CONDITIONS = [
  { value: 'new', label: '新品・未使用' },
  { value: 'good', label: '目立った傷なし' },
  { value: 'fair', label: '傷あり' },
  { value: 'poor', label: 'ジャンク' },
];

export const CreateListing = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState(CATEGORY_TREE[0].code);
  
  const [formData, setFormData] = useState<ListingFormData>({
    name: '',
    description: '',
    categoryId: DEFAULT_CATEGORY_ID,
    condition: 'new',
    images: [],
    price: 0,
    tags: [],
    shipping: {
      shippingPaidBy: 'seller',
      shippingMethod: 'anonymousCourier',
      prefectureFrom: 'Tokyo',
      daysToShip: '2-3',
    },
    investment: {
      isInvestment: false,
    },
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showUserInfoForm, setShowUserInfoForm] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    // タグサジェスト（タイトル・説明から抽出）
    const suggestTags = (name: string, description: string): string[] => {
      const text = `${name} ${description}`.toLowerCase();
      const pairs: Array<[RegExp, string]> = [
        // トレカ
        [/(psa\s*10|bgs\s*black|graded|鑑定)/i, '鑑定品'],
        [/(ポケモン|pokemon)/i, 'ポケモンカード'],
        [/(遊戯王)/i, '遊戯王カード'],
        [/(one\s*piece|ワンピース)/i, 'ワンピースカード'],
        // カメラ
        [/(sony|canon|nikon|fujifilm|leica)/i, 'カメラ'],
        [/(レンズ|望遠|単焦点)/i, 'レンズ'],
        // 技術書
        [/(javascript|python|rust|react|docker|kubernetes)/i, '技術書'],
        // ガジェット
        [/(macbook|thinkpad|ryzen|rtx|ssd|nvme)/i, 'PCパーツ'],
        // スニーカー
        [/(jordan|yeezy|dunk|new\s*balance)/i, 'スニーカー'],
        // ゲーム
        [/(switch|ps5|レトロゲーム|ファミコン)/i, 'ゲーム'],
      ];
      const out = new Set<string>();
      for (const [re, tag] of pairs) {
        if (re.test(text)) out.add(tag);
      }
      // 重要語抽出（上位3単語）
      const words = text.match(/[a-zA-Zぁ-んァ-ヶ一-龠0-9]{3,}/g) || [];
      const freq: Record<string, number> = {};
      words.forEach(w => freq[w] = (freq[w] || 0) + 1);
      Object.entries(freq)
        .sort((a,b) => b[1]-a[1])
        .slice(0, 3)
        .forEach(([w]) => out.add(w));
      return Array.from(out).slice(0, 10);
    };

    useEffect(() => {
      setTagSuggestions(suggestTags(formData.name, formData.description));
    }, [formData.name, formData.description]);

    const addTag = (t: string) => {
      const tag = t.trim();
      if (!tag) return;
      setFormData(prev => ({ ...prev, tags: Array.from(new Set([...(prev.tags || []), tag])).slice(0, 10) }));
      setTagInput('');
    };

    const removeTag = (tag: string) => {
      setFormData(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
    };
  
  // Gemini サジェスト状態
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<{ suggestedPrice: number; reasoning: string; priceRange: { min: number; max: number } } | null>(null);
  const [descriptionSuggestion, setDescriptionSuggestion] = useState<{ description: string; highlights: string[] } | null>(null);
  const [showPriceSuggestion, setShowPriceSuggestion] = useState(false);
  const [showDescriptionSuggestion, setShowDescriptionSuggestion] = useState(false);
  const [listingWarnings, setListingWarnings] = useState<string[]>([]);
  const [suggestedCategoryCode, setSuggestedCategoryCode] = useState<string | null>(null);
  const [showCategorySuggestion, setShowCategorySuggestion] = useState(false);
  const [riskAxes, setRiskAxes] = useState<{ label: string; score: number; hint?: string }[]>([]);
  const [riskOverall, setRiskOverall] = useState<number>(0);
  const [aiRiskLoading, setAiRiskLoading] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<string>('');
  
  const currentUserId = '101'; // TODO: Get from auth context

  const findMainCategoryIdByChild = (childCode: string) => {
    const main = CATEGORY_TREE.find((cat) => (cat.children || []).some((child) => child.code === childCode));
    return main?.code;
  };

  const findCategoryPathLabel = (childCode: string) => {
    for (const cat of CATEGORY_TREE) {
      const child = (cat.children || []).find((c) => c.code === childCode);
      if (child) {
        return `${cat.label} > ${child.label}`;
      }
    }
    return childCode;
  };

  const handleMainCategoryChange = (newMainCode: string) => {
    const main = CATEGORY_TREE.find((cat) => cat.code === newMainCode) || CATEGORY_TREE[0];
    const nextChild = (main.children || [])[0];
    setSelectedMainCategoryId(main.code);
    if (nextChild) {
      setFormData((prev) => ({ ...prev, categoryId: nextChild.code }));
    }
  };

  const handleSubCategoryChange = (childCode: string) => {
    const mainCode = findMainCategoryIdByChild(childCode);
    if (mainCode) {
      setSelectedMainCategoryId(mainCode);
    }
    setFormData((prev) => ({ ...prev, categoryId: childCode }));
  };
  // タイトルからカテゴリー推定（軽量ヒューリスティック）
  const suggestCategoryFromName = (name: string): string | null => {
    const t = name.toLowerCase();
    const checks: Array<{ re: RegExp; code: string }> = [
      // 資産・投資（トレカ系）
      { re: /(psa\s*10|bgs\s*black|graded|鑑定)/i, code: '021' },
      { re: /(pokemon|ポケモン|ピカチュウ|リザードン|カビゴン|ミュウ|ゲンガー|e\s*series|旧裏)/i, code: '011' },
      { re: /(遊戯王|yugi|ブルーアイズ)/i, code: '012' },
      { re: /(one\s*piece|ワンピース|ルフィ|ゾロ|シャンクス)/i, code: '013' },
      { re: /(mtg|magic:\s*the\s*gathering)/i, code: '014' },
      { re: /(nba|mlb|サインカード|スポーツカード)/i, code: '015' },
      // カメラ
      { re: /(sony\s*(a7|a7r|a7s|a9|a1)|e\s*mount|α7|α9|canon\s*(eos\s*r|5d|6d|rp|r5|r6)|nikon\s*(z\s*6|z\s*7|d\d{2,3})|fujifilm\s*(x-?t|x-?pro|gfx)|panasonic\s*(lumix|s\d)|olympus\s*(om-?d)|sigma\s*(fp)|leica\s*(m|q|sl))/i, code: '231' },
      { re: /(レンズ|望遠|単焦点|f\s*\d+\.\d+|\b(24|35|50|85|135)mm\b|ズームレンズ|純正レンズ)/i, code: '232' },
      { re: /(三脚|gimbal|ジンバル|ストロボ|スピードライト|nd\s*フィルター|cpl\s*フィルター)/i, code: '233' },
      // 本・技術書
      { re: /(javascript|typescript|python|go言語|golang|rust|react|vue|angular|docker|kubernetes|機械学習|深層学習|deep\s*learning|統計|データサイエンス|アルゴリズム)/i, code: '131' },
      { re: /(漫画|コミック|novel|小説|文庫|新書|ライトノベル|ラノベ|全集)/i, code: '133' },
      { re: /(資格|過去問|参考書|問題集|教科書|テキスト)/i, code: '134' },
      // ガジェット・PC
      { re: /(macbook\s*(air|pro)|imac|mac\s*mini|thinkpad|x1\s*carbon|ryzen|intel\s*i[3579]|geforce|rtx\s*\d{3,4}|radeon|外付けssd|m\.2\s*ssd|nvme)/i, code: '211' },
      { re: /(ゲーミング\s*(pc|mouse|keyboard)|メカニカルキーボード|モニター|144hz|240hz|ウルトラワイド|液晶ディスプレイ)/i, code: '214' },
      { re: /(スマートフォン|iphone\s*(\d{1,2}|pro|max|plus|mini)|android|galaxy|pixel\s*\d)/i, code: '212' },
      // ゲーム
      { re: /(switch\s*ソフト|nintendo\s*switch|ps5\s*ソフト|ps4\s*ソフト|レトロゲーム|ファミコン|スーパーファミコン|メガドライブ|pc\s*ゲーム)/i, code: '411' },
      // スニーカー・ファッション
      { re: /(nike\s*dunk|air\s*jordan\s*(1|3|4|11)|yeezy\s*boost|new\s*balance\s*(990|2002|996)|sb\s*dunk|off\s*white|supreme)/i, code: '521' },
      { re: /(サイズ\s*(26\.5|27|27\.5|28|us\s*\d|eu\s*\d{2})|箱\s*あり|タグ\s*付き)/i, code: '523' },
    ];
    for (const c of checks) {
      if (c.re.test(t)) return c.code;
    }
    return null;
  };

  // タイトル変更で推奨カテゴリ更新
  useEffect(() => {
    const code = suggestCategoryFromName(formData.name);
    setSuggestedCategoryCode(code);
    setShowCategorySuggestion(!!code && code !== formData.categoryId);
  }, [formData.name, formData.categoryId]);

  const applySuggestedCategory = () => {
    if (!suggestedCategoryCode) return;
    const mainCode = findMainCategoryIdByChild(suggestedCategoryCode);
    if (mainCode) setSelectedMainCategoryId(mainCode);
    setFormData((prev) => ({ ...prev, categoryId: suggestedCategoryCode }));
    setShowCategorySuggestion(false);
  };

  // AIリスク判定(Gemini)を明示的に実行
  const handleRunRiskAssessment = async () => {
    const ready = (formData.name?.trim().length || 0) > 0 && !!formData.categoryId && !!formData.condition && Number(formData.price) > 0;
    if (!ready) {
      alert('商品名・カテゴリ・状態・価格を入力した後でリスク診断を実行してください');
      return;
    }
    setAiRiskLoading(true);
    try {
      let imageDesc = imageAnalysisResult;
      
      // If images exist but not analyzed yet, analyze first image
      if (selectedFiles.length > 0 && !imageAnalysisResult) {
        try {
          const file = selectedFiles[0];
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          const result = await analyzeImage(base64);
          imageDesc = `タイトル: ${result.name || '不明'}, カテゴリ: ${result.category || '不明'}, 状態: ${result.conditionComment || '不明'}`;
          setImageAnalysisResult(imageDesc);
        } catch (err) {
          console.warn('Image analysis failed, proceeding without it:', err);
        }
      }
      
      const payload = {
        name: formData.name,
        category: findCategoryPathLabel(formData.categoryId),
        condition: formData.condition,
        description: formData.description,
        price: Number(formData.price || 0),
        tags: formData.tags || [],
        imageDescription: imageDesc || '',
      };
      await suggestRiskAssessment(payload);
    } catch (e) {
      console.error('AI risk assessment failed', e);
      alert('AIリスク診断に失敗しました。時間をおいて再度お試しください');
    } finally {
      setAiRiskLoading(false);
    }
  };


  const currentMainCategory =
    CATEGORY_TREE.find((cat) => cat.code === selectedMainCategoryId) || CATEGORY_TREE[0];

  // 画像選択
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 10) {
      alert('最大10枚までしかアップロードできません');
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    setFormData({ ...formData, images: newFiles });

    // プレビュー生成
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // 最初の画像をAIで解析
    if (selectedFiles.length === 0 && files.length > 0) {
      handleAIAnalyze(files[0]);
    }
  };

  // カメラ起動（ブラウザが権限ダイアログを表示）
  const handleOpenCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 0);
    } catch (err) {
      alert('カメラへのアクセスが拒否されました。ブラウザの権限設定をご確認ください。');
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      // 画像選択と同様に処理
      setSelectedFiles((prev) => {
        const newFiles = [...prev, file];
        setFormData((f) => ({ ...f, images: newFiles }));
        return newFiles;
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
      // 最初の画像ならAI解析
      if (selectedFiles.length === 0) {
        handleAIAnalyze(file);
      }
      // カメラ停止
      handleCloseCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    const s = streamRef.current;
    s?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // AI解析
  const handleAIAnalyze = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const result = await analyzeImage(base64);
        
        // Store image analysis result for risk assessment
        const analysisDesc = `タイトル: ${result.title || '不明'}, カテゴリ: ${result.category || '不明'}, 状態: ${result.conditionComment || '不明'}`;
        setImageAnalysisResult(analysisDesc);
        
        if (result.name) {
          setFormData((prev) => ({ ...prev, name: result.name || '' }));
        }
        if (result.conditionComment) {
          setFormData((prev) => ({ 
            ...prev, 
            description: result.conditionComment || '' 
          }));
        }
        // カテゴリマッピング（階層版）
        if (result.category) {
          const categoryMap: Record<string, string> = {
            'トレーディングカード': 'hobby-tcg',
            'トレカ': 'hobby-tcg',
            'カード': 'hobby-tcg',
            'ポケモン': 'hobby-tcg',
            '遊戯王': 'hobby-tcg',
            'MTG': 'hobby-tcg',
            'ワンピース': 'hobby-tcg',
            'フィギュア': 'hobby-figure',
            'プラモデル': 'hobby-figure',
            'ホビー': 'hobby-figure',
            '模型': 'hobby-model',
            '鉄道模型': 'hobby-model',
            'ボードゲーム': 'hobby-boardgame',
            'TRPG': 'hobby-boardgame',
            'アニメ': 'hobby-anime',
            'キャラグッズ': 'hobby-anime',
            'スニーカー': '714',
            'メンズ': '710',
            'レディース': '720',
            'バッグ': '723',
            'ブランド': '041',
            '時計': '730',
            'アクセサリー': '730',
            'ジュエリー': '730',
            'スマホ': '210',
            'スマートフォン': '210',
            '携帯': '210',
            'タブレット': 'sci-mobile',
            'PC': '220',
            'ノートPC': '221',
            'デスクトップ': '220',
            '自作PC': '223',
            'パーツ': '223',
            '周辺機器': '220',
            'カメラ': '230',
            'レンズ': '232',
            'ビデオカメラ': '230',
            'オーディオ': '920',
            'イヤホン': '920',
            'ヘッドホン': '920',
            'スピーカー': '920',
            'テレビ': '440',
            '映像': '440',
            'ゲーム機': 'ent-game',
            'ゲームソフト': 'ent-game',
            'ゲーム': 'ent-game',
            'おもちゃ': 'hobby-anime',
            'スポーツ': 'sports-running',
            'アウトドア': 'sports-camp',
            '自転車': 'B00',
            '釣り': 'A20',
            'キャンプ': 'A10',
            '登山': 'A10',
            'ランニング': 'B50',
            'フィットネス': 'B50',
            'スキー': 'B00',
            'スノーボード': 'B00',
            'サーフィン': 'B00',
            '楽器': 'arts-instruments',
            'DTM': 'arts-dtm',
            '音楽': 'arts-dtm',
            '家電': '400',
            'キッチン家電': '420',
            '生活家電': '410',
            '掃除機': '410',
            '洗濯機': '410',
            '空調家電': '430',
            '家具': '800',
            'インテリア': '800',
            'DIY': '600',
            '工具': '600',
            '園芸': '600',
            'ガーデン': '600',
            'ペット': 'C20',
            '収納': '840',
            '本': '100',
            '小説': '131',
            '文学': '131',
            'マンガ': '110',
            '漫画': '110',
            '雑誌': '132',
            '歴史': '100',
            '地理': '100',
            '哲学': '100',
            '宗教': '100',
            '語学': '120',
            '辞典': '120',
            '経済': '121',
            '金融': '123',
            'ビジネス': '121',
            'マーケ': '121',
            '広告': '121',
            '教育': '120',
            '資格': '120',
            '医学': '500',
            '看護': '500',
            '健康': 'B50',
            'フィジカル': 'B50',
            '食': 'C10',
            '栄養': 'C10',
            '食品': 'C10',
            '飲料': 'C10',
            'コスメ': '500',
            '美容': '500',
            'リラクゼーション': '500',
            'アロマ': '500',
            'CD': '920',
            'レコード': '920',
            'DVD': '920',
            'ブルーレイ': '920',
            '映画': '920',
            '音楽ソフト': '920',
            '車': 'C30',
            'バイク': 'C30',
            'チケット': 'ent-ticket',
            'イベント': 'ent-ticket',
            'キッズ': '300',
            'ベビー': '300',
            'その他': 'C99',
          };
          const mappedCategory = categoryMap[result.category];
          if (mappedCategory) {
            setSuggestedCategoryCode(mappedCategory);
            setShowCategorySuggestion(true);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('AI解析に失敗しました。手動で入力してください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 画像削除
  const handleDeleteImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
    setFormData({ ...formData, images: newFiles });
  };

  // Gemini AI サジェスト取得
  const handleGetGeminiSuggestions = async () => {
    if (!formData.name.trim()) {
      alert('商品名を入力してから、Geminiサジェストを取得してください');
      return;
    }

    setIsGeminiLoading(true);
    try {
      const categoryLabel = findCategoryPathLabel(formData.categoryId);
      
      // 価格サジェスト取得
      const priceResult = await suggestPrice(
        formData.name,
        CONDITIONS.find(c => c.value === formData.condition)?.label || formData.condition,
        categoryLabel,
        formData.description
      );
      
      if (priceResult) {
        setPriceSuggestion(priceResult);
        setShowPriceSuggestion(true);
      }

      // 説明文サジェスト取得
      const descResult = await suggestDescription(
        formData.name,
        CONDITIONS.find(c => c.value === formData.condition)?.label || formData.condition,
        categoryLabel,
        formData.description
      );
      
      if (descResult) {
        setDescriptionSuggestion(descResult);
        setShowDescriptionSuggestion(true);
      }

      if (!priceResult && !descResult) {
        alert('Geminiのサジェスト取得に失敗しました。APIキーが設定されているか確認してください。');
      }
    } catch (error) {
      console.error('Gemini suggestions failed:', error);
      alert('Geminiサジェスト取得に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsGeminiLoading(false);
    }
  };

  // 価格サジェストを承認
  const handleAcceptPriceSuggestion = () => {
    if (priceSuggestion) {
      setFormData({ ...formData, price: priceSuggestion.suggestedPrice });
      setShowPriceSuggestion(false);
      setPriceSuggestion(null);
    }
  };

  // 説明文サジェストを承認
  const handleAcceptDescriptionSuggestion = () => {
    if (descriptionSuggestion) {
      setFormData({ ...formData, description: descriptionSuggestion.description });
      setShowDescriptionSuggestion(false);
      setDescriptionSuggestion(null);
    }
  };


  // 手数料計算（10%）
  const fee = Math.floor(formData.price * 0.1);
  const profit = formData.price - fee;

  // 送料計算
  const getShippingCost = () => {
    if (formData.shipping.shippingPaidBy === 'buyer') return 0;
    return formData.price > 50000 ? 0 : 880;
  };

  const netProfit = profit - getShippingCost();

  // 不明瞭リスクの簡易診断（出品者向け）
  const evaluateListingWarnings = () => {
    const warnings: string[] = [];
    if (!formData.name.trim() || formData.name.trim().length < 5) warnings.push('商品名が短すぎます（5文字以上推奨）');
    if (!formData.description.trim() || formData.description.trim().length < 20) warnings.push('説明が少ないです（20文字以上推奨）');
    // 説明が長いが要点が不明瞭
    if (formData.description.trim().length > 300) {
      const hasBullet = /\n[-*・]/.test(formData.description) || /\n\d+\./.test(formData.description);
      const hasHeadings = /(特徴|仕様|状態|付属品|注意点)/.test(formData.description);
      if (!hasBullet && !hasHeadings) {
        warnings.push('説明が長文ですが構造化されていません（箇条書き・見出しの追加を推奨）');
      }
    }
    if (!formData.categoryId) warnings.push('カテゴリが未選択です');
    if (!formData.condition) warnings.push('商品の状態が未選択です');
    if (selectedFiles.length < 2) warnings.push('画像が少ないです（2枚以上推奨）');
    if (formData.price <= 0) warnings.push('価格が未設定です');
    const riskyWords = ['激レア', '本人確認不要', '即投資', 'NCNR', '返金不可'];
    if (riskyWords.some((w) => formData.name.includes(w) || formData.description.includes(w))) {
      warnings.push('注意: 誤解を招く可能性のある表現が含まれています');
    }
    // 価格レンジの分散が大きい場合はタイトル/仕様が大まかでないか警告
    if (priceSuggestion) {
      const { min = 0, max = 0 } = priceSuggestion.priceRange || {};
      if (max > 0 && max - min > 0) {
        const spread = (max - min) / max;
        if (spread > 0.4) {
          warnings.push('タイトルや仕様が大まかで相場レンジが広いです（型番・容量・グレードを具体的に）');
        }
      }
    }
    // 年式・初版チェックは簡易診断では除外（誤検知を避ける）
    setListingWarnings(warnings);

    // 多軸リスク評価（0 = 低リスク, 100 = 高リスク）
    const axes: { label: string; score: number; hint?: string }[] = [];
    // 1) 情報明瞭性
    const nameLen = formData.name.trim().length;
    const descLen = formData.description.trim().length;
    const hasStructure = /\n[-*・]/.test(formData.description) || /\n\d+\./.test(formData.description) || /\n\n/.test(formData.description);
    let clarityRisk = 0;
    if (nameLen < 6) clarityRisk += 20;
    if (descLen < 40) clarityRisk += 30;
    if (!hasStructure && descLen > 240) clarityRisk += 30;
    axes.push({ label: '情報明瞭性', score: Math.min(100, clarityRisk), hint: 'タイトル・説明の構造と十分さ' });

    // 2) 価格妥当性（Geminiサジェスト優先、無い場合は簡易ヒューリスティック）
    let priceRisk = 0;
    if (!formData.price || formData.price <= 0) {
      priceRisk = 60;
    } else if (priceSuggestion) {
      const target = priceSuggestion.suggestedPrice || ((priceSuggestion.priceRange?.min || 0) + (priceSuggestion.priceRange?.max || 0)) / 2 || formData.price;
      const lower = priceSuggestion.priceRange?.min ?? target * 0.8;
      const upper = priceSuggestion.priceRange?.max ?? target * 1.2;
      const price = formData.price;
      const spread = upper > 0 ? (upper - lower) / upper : 0;
      if (spread > 0.4) {
        priceRisk += 15; // タイトル/仕様が大まかで相場レンジが広い場合に加点
      }
      if (price < lower) {
        priceRisk = Math.min(100, 60 * ((lower - price) / lower));
      } else if (price > upper) {
        priceRisk = Math.min(100, 60 * ((price - upper) / upper));
      } else {
        const diff = Math.abs(price - target) / target;
        priceRisk = diff < 0.1 ? 10 : diff < 0.25 ? 25 : 45;
      }
    } else {
      const tol = formData.price < 10000 ? 0.15 : formData.price < 50000 ? 0.25 : 0.35;
      const isInvestLike = /(PSA|BGS|鑑定|投資|プロモ)/i.test(formData.name + ' ' + formData.description);
      const ref = isInvestLike ? 40000 : 8000;
      const lower = ref * (1 - tol);
      const upper = ref * (1 + tol);
      if (formData.price < lower) priceRisk += 25;
      if (formData.price > upper) priceRisk += 25;
    }
    axes.push({ label: '価格妥当性', score: Math.min(100, priceRisk), hint: priceSuggestion ? 'Geminiサジェストとの乖離' : '相場推定からの外れ幅（簡易）' });

    // 3) 真正性リスク（あいまい/煽り/グレー表現）
    const riskyWordsRe = /(未検品|本物保証なし|ノークレーム|値下げ不可|完全ノーリターン|それっぽい|多分)/i;
    const authenticityRisk = riskyWordsRe.test(formData.description) ? 55 : 15;
    axes.push({ label: '真正性リスク', score: authenticityRisk, hint: '怪しい表現/免責の多用' });

    // 4) 出品者信頼（作成画面では不明なため保守的に）
    let trustRisk = 20;
    if (selectedFiles.length < 2) trustRisk += 20;
    if (!formData.shipping.shippingMethod) trustRisk += 20;
    axes.push({ label: '出品者信頼', score: Math.min(100, trustRisk), hint: '画像枚数・配送情報の充実度' });

    // 5) カテゴリ適合
    const hasCategory = !!formData.categoryId;
    const categorySignal = /(カメラ|本|トレカ|カード|衣類|ゲーム|PC|Mac|ノート)/i;
    let categoryRisk = 35;
    if (hasCategory) categoryRisk -= 15;
    if (categorySignal.test(formData.name + ' ' + formData.description)) categoryRisk -= 10;
    axes.push({ label: 'カテゴリ適合', score: Math.max(0, categoryRisk), hint: '選択カテゴリと記述の一致' });

    setRiskAxes(axes);
    const weights = [0.25, 0.25, 0.2, 0.15, 0.15];
    const overall = axes.reduce((acc, a, i) => acc + a.score * (weights[i] || 0), 0);
    setRiskOverall(Math.round(overall));
  };

  // 入力のたびに簡易診断を更新
  useEffect(() => {
    evaluateListingWarnings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name, formData.description, formData.categoryId, formData.condition, formData.price, selectedFiles.length, priceSuggestion]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!formData.name.trim()) {
      alert('商品名を入力してください');
      return;
    }
    if (selectedFiles.length === 0) {
      alert('少なくとも1枚の画像を選択してください');
      return;
    }
    if (formData.price <= 0) {
      alert('有効な価格を入力してください');
      return;
    }

    // 出品ボタン押下時に個人情報入力フォームを表示
    setShowUserInfoForm(true);
  };

  const handleUserInfoSubmit = async (data: UserInfoData) => {
    console.log('[CreateListing] User info submitted:', data);
    setShowUserInfoForm(false);
    setIsSubmitting(true);
    try {
      const result = await createListing(formData, currentUserId);
      console.log('[CreateListing] Listing created:', result);
      alert('出品しました！');
      // 遅延してホームに戻る（バックエンドの出品数更新を待つ）
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (error) {
      console.error('Error submitting listing:', error);
      alert('出品に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ヘッダー */}
      <header className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-gray-500 font-bold">
          ✕
        </button>
        <h1 className="font-bold text-lg">商品を出品する</h1>
        <button
          onClick={() => handleSubmit()}
          className="text-red-500 font-bold hover:text-red-600"
        >
          出品する
        </button>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 商品情報（商品名） */}
          <section className="bg-white p-4 rounded-xl shadow-sm space-y-3">
            <h2 className="font-bold text-lg">商品情報</h2>
            <div>
              <label className="block text-sm font-bold mb-2">商品名 *</label>
              <input
                type="text"
                maxLength={40}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="商品名を入力（40文字以内）"
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.name.length}/40文字</p>
            </div>
          </section>

          {/* 商品画像 */}
          <section className="bg-white p-4 rounded-xl shadow-sm">
            <h2 className="font-bold text-lg mb-4">
              商品画像
              {isAnalyzing && (
                <span className="ml-2 text-sm text-blue-500">🤖 AI解析中...</span>
              )}
            </h2>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <img src={preview} alt={`Preview ${idx}`} className="w-full h-24 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {selectedFiles.length < 10 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleOpenCamera}
                  className="flex-1 border-2 border-dashed border-gray-300 p-4 rounded-lg text-center hover:bg-gray-50 transition"
                >
                  📷 カメラ
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 border-2 border-dashed border-gray-300 p-4 rounded-lg text-center hover:bg-gray-50 transition"
                >
                  🖼️ アルバム
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">{selectedFiles.length}/10枚</p>
          </section>

          {/* 分類・状態 */}
          <section className="bg-white p-4 rounded-xl shadow-sm space-y-4">
            <h2 className="font-bold text-lg">分類・状態</h2>

            {showCategorySuggestion && suggestedCategoryCode && (
              <div className="bg-indigo-50 border-2 border-indigo-200 p-3 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-indigo-800">🔎 タイトルからカテゴリ候補</div>
                    <div className="text-xs text-indigo-700 mt-1">{findCategoryPathLabel(suggestedCategoryCode)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={applySuggestedCategory}>適用</button>
                    <button className="text-xs px-3 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200" onClick={() => setShowCategorySuggestion(false)}>閉じる</button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-bold">カテゴリ *</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <select
                  value={selectedMainCategoryId}
                  onChange={(e) => handleMainCategoryChange(e.target.value)}
                  className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORY_TREE.map((cat) => (
                    <option key={cat.code} value={cat.code}>{cat.label}</option>
                  ))}
                </select>

                <select
                  value={formData.categoryId}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(currentMainCategory.children || []).map((child) => (
                    <option key={child.code} value={child.code}>{child.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500">{findCategoryPathLabel(formData.categoryId)}</p>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">商品の状態 *</label>
              <select
                value={formData.condition}
                onChange={(e) =>
                  setFormData({ ...formData, condition: e.target.value as ListingFormData['condition'] })
                }
                className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CONDITIONS.map((cond) => (
                  <option key={cond.value} value={cond.value}>{cond.label}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Gemini サジェスト */}
          <section className="bg-white p-4 rounded-xl shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-lg">Gemini サジェスト</h2>
              <button
                type="button"
                onClick={handleGetGeminiSuggestions}
                disabled={isGeminiLoading || !formData.name.trim()}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full font-bold hover:bg-blue-600 transition disabled:bg-gray-400 flex items-center gap-1"
              >
                {isGeminiLoading ? (<><span className="animate-spin">⏳</span> 生成中</>) : (<>✨ サジェスト取得</>)}
              </button>
            </div>
            <p className="text-xs text-slate-600">価格と説明文の両方をAIが提案します。リスク評価も精緻化されます。</p>

            {showPriceSuggestion && priceSuggestion && (
              <div className="bg-blue-50 border-2 border-blue-200 p-3 rounded-lg">
                <h3 className="font-bold text-sm mb-2">💡 Gemini価格サジェスト</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>推奨価格:</span>
                    <span className="font-bold text-lg text-blue-600">¥{priceSuggestion.suggestedPrice.toLocaleString()}</span>
                  </div>
                  <div className="text-gray-700">{priceSuggestion.reasoning}</div>
                  <div className="flex justify-between text-xs text-gray-600 pt-2 border-t">
                    <span>価格帯: ¥{priceSuggestion.priceRange.min.toLocaleString()} ～ ¥{priceSuggestion.priceRange.max.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={handleAcceptPriceSuggestion} className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded font-bold hover:bg-blue-600 transition">この価格を使う</button>
                    <button type="button" onClick={() => setShowPriceSuggestion(false)} className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded font-bold hover:bg-gray-400 transition">却下</button>
                  </div>
                </div>
              </div>
            )}

            {showDescriptionSuggestion && descriptionSuggestion && (
              <div className="bg-green-50 border-2 border-green-200 p-3 rounded-lg">
                <h3 className="font-bold text-sm mb-2">💡 Gemini説明文サジェスト</h3>
                <div className="space-y-2 text-sm">
                  <div className="bg-white p-2 rounded border text-gray-800">{descriptionSuggestion.description}</div>
                  {descriptionSuggestion.highlights.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-gray-600">ハイライト:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {descriptionSuggestion.highlights.map((highlight, idx) => (
                          <span key={idx} className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded">{highlight}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={handleAcceptDescriptionSuggestion} className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded font-bold hover:bg-green-600 transition">この説明を使う</button>
                    <button type="button" onClick={() => setShowDescriptionSuggestion(false)} className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded font-bold hover:bg-gray-400 transition">却下</button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 商品説明 */}
          <section className="bg-white p-4 rounded-xl shadow-sm space-y-3">
            <h2 className="font-bold text-lg">商品説明</h2>
            <textarea
              maxLength={1000}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="商品の状態や特徴を入力（1000文字以内）"
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={5}
            />
            <p className="text-xs text-gray-500">{formData.description.length}/1000文字</p>
          </section>

          {/* タグ */}
          <section className="bg-white p-4 rounded-xl shadow-sm">
            <h2 className="font-bold text-lg mb-3">タグ</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {(formData.tags || []).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-slate-100 border border-slate-200">
                  #{tag}
                  <button type="button" className="text-slate-500 hover:text-red-600" onClick={() => removeTag(tag)}>×</button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                placeholder="タグを入力してEnterで追加"
                className="flex-1 p-2 border border-gray-300 rounded"
              />
              <button type="button" className="px-3 py-2 rounded bg-slate-800 text-white text-sm" onClick={() => addTag(tagInput)}>追加</button>
            </div>
            {tagSuggestions.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-slate-600 mb-1">おすすめタグ</div>
                <div className="flex flex-wrap gap-2">
                  {tagSuggestions.map((sug) => (
                    <button key={sug} type="button" className="px-2 py-1 rounded-full text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100" onClick={() => addTag(sug)}>#{sug}</button>
                  ))}
                </div>
              </div>
            )}
            {descriptionSuggestion?.highlights?.length ? (
              <div className="mt-3">
                <div className="text-xs text-slate-600 mb-1">Geminiのハイライトからタグ候補</div>
                <div className="flex flex-wrap gap-2">
                  {descriptionSuggestion.highlights.map((h, i) => (
                    <button key={i} type="button" className="px-2 py-1 rounded-full text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100" onClick={() => addTag(h)}>{h}</button>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          {showCamera && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white w-full max-w-md rounded-xl overflow-hidden shadow-lg">
                <div className="bg-black">
                  <video ref={videoRef} className="w-full" playsInline muted></video>
                </div>
                <div className="p-3 flex gap-2">
                  <button onClick={handleCapturePhoto} className="flex-1 bg-red-500 text-white font-bold py-2 rounded">撮影</button>
                  <button onClick={handleCloseCamera} className="flex-1 bg-gray-300 text-gray-800 font-bold py-2 rounded">閉じる</button>
                </div>
              </div>
            </div>
          )}

          {/* ===== 4. 投資・トレカ特化機能 ===== */}
          <section className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-xl shadow-sm space-y-4">
            <h2 className="font-bold text-lg text-yellow-700">💎 投資対象として出品</h2>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.investment.isInvestment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    investment: { ...formData.investment, isInvestment: e.target.checked },
                  })
                }
                className="w-5 h-5"
              />
              <span className="font-bold">投資対象商品として登録する</span>
            </label>

            {formData.investment.isInvestment && (
              <>
                {/* 鑑定情報 */}
                <div className="border-t pt-4">
                  <h3 className="font-bold mb-3">鑑定情報</h3>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-bold mb-2">鑑定機関</label>
                      <select
                        value={formData.investment.gradingInfo?.grader || 'none'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            investment: {
                              ...formData.investment,
                              gradingInfo: {
                                ...(formData.investment.gradingInfo || {}),
                                grader: e.target.value as GradingInfo['grader'],
                              },
                            },
                          })
                        }
                        className="w-full border rounded-lg p-2 text-sm"
                      >
                        <option value="none">未鑑定</option>
                        <option value="PSA">PSA</option>
                        <option value="BGS">BGS</option>
                        <option value="CGC">CGC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">グレード</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="0.5"
                        value={formData.investment.gradingInfo?.grade || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            investment: {
                              ...formData.investment,
                              gradingInfo: {
                                grader: formData.investment.gradingInfo?.grader || 'none',
                                ...(formData.investment.gradingInfo || {}),
                                grade: e.target.value ? parseFloat(e.target.value) : undefined,
                              },
                            },
                          })
                        }
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="例: 9.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">証明番号</label>
                    <input
                      type="text"
                      value={formData.investment.gradingInfo?.certNumber || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          investment: {
                            ...formData.investment,
                            gradingInfo: {
                              grader: formData.investment.gradingInfo?.grader || 'none',
                              ...(formData.investment.gradingInfo || {}),
                              certNumber: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="例: 123456789"
                      className="w-full border rounded-lg p-2 text-sm"
                    />
                  </div>
                </div>

                {/* 倉庫保管オプション */}
                <div className="border-t pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.investment.warehouseStorage?.enabled || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          investment: {
                            ...formData.investment,
                            warehouseStorage: {
                              ...formData.investment.warehouseStorage,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                      className="w-5 h-5"
                    />
                    <div>
                      <span className="font-bold block">倉庫保管を利用する</span>
                      <span className="text-xs text-gray-600">
                        当社提携倉庫で保管・鑑定代行。購入者は即座に所有権移転が可能
                      </span>
                    </div>
                  </label>
                </div>
              </>
            )}
          </section>

          {/* ===== 5. 配送設定 ===== */}
          <section className="bg-white p-4 rounded-xl shadow-sm space-y-4">
            <h2 className="font-bold text-lg">配送について</h2>
            
            <div>
              <label className="block text-sm font-bold mb-2">送料負担</label>
              <div className="flex gap-2">
                {[
                  { value: 'seller', label: '出品者負担' },
                  { value: 'buyer', label: '購入者負担' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="shipping"
                      value={opt.value}
                      checked={formData.shipping.shippingPaidBy === opt.value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping: {
                            ...formData.shipping,
                            shippingPaidBy: e.target.value as ShippingSettings['shippingPaidBy'],
                          },
                        })
                      }
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">配送方法</label>
              <select
                value={formData.shipping.shippingMethod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shipping: {
                      ...formData.shipping,
                      shippingMethod: e.target.value as ShippingSettings['shippingMethod'],
                    },
                  })
                }
                className="w-full border rounded-lg p-3 text-sm"
              >
                <option value="anonymousCourier">匿名配送（宅配便）</option>
                <option value="postalMail">普通郵便</option>
                <option value="letterPack">レターパック</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">発送までの日数</label>
              <select
                value={formData.shipping.daysToShip}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shipping: {
                      ...formData.shipping,
                      daysToShip: e.target.value as ShippingSettings['daysToShip'],
                    },
                  })
                }
                className="w-full border rounded-lg p-3 text-sm"
              >
                <option value="1-2">1～2日で発送</option>
                <option value="2-3">2～3日で発送</option>
                <option value="4-7">4～7日で発送</option>
              </select>
            </div>
          </section>

          {/* ===== 6. 価格設定 ===== */}
          <section className="bg-white p-4 rounded-xl shadow-sm space-y-4">
            <h2 className="font-bold text-lg">価格設定</h2>
            
            <div>
              <label className="block text-sm font-bold mb-2">出品価格 *</label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">¥</span>
                <input
                  type="number"
                  min="300"
                  max="9999999"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  className="flex-1 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">¥300 ～ ¥9,999,999</p>
            </div>

            {/* 手数料計算表示 */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span>出品価格</span>
                <span className="font-bold">¥{formData.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>販売手数料（10%）</span>
                <span>-¥{fee.toLocaleString()}</span>
              </div>
              {formData.shipping.shippingPaidBy === 'seller' && (
                <div className="flex justify-between text-orange-500">
                  <span>送料</span>
                  <span>-¥{getShippingCost().toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>あなたの利益</span>
                <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ¥{netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </section>
        </form>

        {/* リスク診断（簡易 + AI） */}
        <section className="bg-white p-4 rounded-xl shadow-sm space-y-3">
          <h2 className="font-bold text-lg">リスク診断（簡易 + AI）</h2>

          <div className="space-y-2 text-sm">
            <div className="font-semibold text-amber-800">簡易チェック</div>
            {listingWarnings.length > 0 ? (
              <ul className="list-disc list-inside text-amber-900 space-y-1">
                {listingWarnings.map((w, i) => (<li key={i}>{w}</li>))}
              </ul>
            ) : (
              <div className="text-emerald-700">簡易チェック上の問題は見つかりません。</div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="font-semibold text-slate-800">多軸スコア</div>
            <div className="text-right mb-1">
              <button
                type="button"
                onClick={handleRunRiskAssessment}
                disabled={aiRiskLoading}
                className="px-3 py-2 bg-blue-500 text-white text-sm rounded font-bold hover:bg-blue-600 transition disabled:bg-gray-400"
              >
                {aiRiskLoading ? '診断中…' : 'Geminiでリスク診断する'}
              </button>
            </div>
            {aiRiskLoading ? (
              <div className="text-slate-500">Geminiがリスクを評価中…</div>
            ) : riskAxes.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm">総合リスク: <span className={riskOverall > 60 ? 'text-red-600' : riskOverall > 35 ? 'text-amber-600' : 'text-emerald-600'}>{riskOverall}</span> / 100</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {riskAxes.map((ax, i) => (
                    <div key={i} className="p-2 rounded border border-slate-200">
                      <div className="text-sm text-slate-700">{ax.label}</div>
                      <div className="mt-1 h-2 bg-slate-200 rounded">
                        <div
                          className={'h-2 rounded ' + (ax.score > 60 ? 'bg-red-500' : ax.score > 35 ? 'bg-amber-500' : 'bg-emerald-500')}
                          style={{ width: `${Math.min(100, Math.max(0, ax.score))}%` }}
                        />
                      </div>
                      {ax.hint && <div className="mt-1 text-xs text-slate-500">{ax.hint}</div>}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-600">Geminiのリスク診断結果を多軸で表示しています。</div>
              </div>
            ) : (
              <div className="text-slate-500">AIリスク診断を実行するとここにスコアが表示されます。</div>
            )}
          </div>
        </section>
      </main>

      {/* 固定フッター送信ボタン */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-bottom">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="w-full bg-red-500 text-white py-4 rounded-full font-bold text-lg hover:bg-red-600 transition disabled:bg-gray-400"
          >
            {isSubmitting ? '出品中...' : '出品する'}
          </button>
        </div>
      </div>

      {/* 個人情報入力フォーム */}
      {showUserInfoForm && (
        <UserInfoForm
          title="出品手続き - 個人情報入力"
          description="商品の出品および売上金の振込のため、以下の情報を入力してください。"
          submitButtonText="出品を確定する"
          onSubmit={handleUserInfoSubmit}
          onCancel={() => setShowUserInfoForm(false)}
        />
      )}
    </div>
  );
};
