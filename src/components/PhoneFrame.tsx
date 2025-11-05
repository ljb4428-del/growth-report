import { Smartphone } from 'lucide-react';

interface Props {
  imageUrl: string;
  caption?: string;
}

export default function PhoneFrame({ imageUrl, caption }: Props) {
  return (
    <div className="phone-frame-container">
      {/* 스마트폰 프레임 */}
      <div className="relative bg-gray-900 rounded-3xl p-3 shadow-2xl max-w-sm mx-auto">
        {/* 노치 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>
        
        {/* 화면 */}
        <div className="relative bg-white rounded-2xl overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
          {/* 상태 바 영역 */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/20 to-transparent z-10"></div>
          
          {/* 이미지 */}
          <img
            src={imageUrl}
            alt="Instagram Insights Screenshot"
            className="w-full h-full object-cover"
          />
          
          {/* 홈 인디케이터 */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-gray-900 rounded-full"></div>
        </div>
        
        {/* 전원 버튼 (우측) */}
        <div className="absolute right-0 top-24 w-1 h-12 bg-gray-800 rounded-l"></div>
        
        {/* 볼륨 버튼 (좌측) */}
        <div className="absolute left-0 top-20 w-1 h-8 bg-gray-800 rounded-r"></div>
        <div className="absolute left-0 top-32 w-1 h-8 bg-gray-800 rounded-r"></div>
      </div>
      
      {/* 캡션 */}
      {caption && (
        <p className="text-center text-sm text-gray-600 mt-4">{caption}</p>
      )}
    </div>
  );
}

