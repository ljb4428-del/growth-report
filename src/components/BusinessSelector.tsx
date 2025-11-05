import { useState } from 'react';
import { Business } from '../types';
import { ChevronDown, Plus, Edit2, Trash2, Building2 } from 'lucide-react';

interface Props {
  businesses: Business[];
  selectedBusiness: Business;
  onSelect: (business: Business) => void;
  onCreate: (name: string, description?: string) => Promise<boolean>;
  onUpdate: (id: string, name: string, description?: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export default function BusinessSelector({
  businesses,
  selectedBusiness,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  function handleCreate() {
    setFormData({ name: '', description: '' });
    setShowCreateModal(true);
  }

  function handleEdit(business: Business) {
    setEditingBusiness(business);
    setFormData({ name: business.name, description: business.description || '' });
    setShowEditModal(true);
  }

  async function handleSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (formData.name.trim()) {
      const success = await onCreate(formData.name, formData.description);
      if (success) {
        setShowCreateModal(false);
        setFormData({ name: '', description: '' });
      }
    }
  }

  async function handleSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editingBusiness && formData.name.trim()) {
      const success = await onUpdate(editingBusiness.id, formData.name, formData.description);
      if (success) {
        setShowEditModal(false);
        setEditingBusiness(null);
        setFormData({ name: '', description: '' });
      }
    }
  }

  async function handleDeleteClick(business: Business) {
    if (confirm(`"${business.name}" 비즈니스를 삭제하시겠습니까? 모든 데이터가 삭제됩니다.`)) {
      await onDelete(business.id);
    }
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          <Building2 className="w-5 h-5 text-primary-600" />
          <span className="font-medium">{selectedBusiness.name}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="p-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleCreate();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-100 rounded-md text-primary-600 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>새 비즈니스 추가</span>
                </button>
              </div>

              <div className="border-t border-gray-200 max-h-96 overflow-y-auto">
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${
                      business.id === selectedBusiness.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSelect(business);
                        setIsOpen(false);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-gray-900">{business.name}</div>
                      {business.description && (
                        <div className="text-sm text-gray-500 truncate">
                          {business.description}
                        </div>
                      )}
                    </button>

                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOpen(false);
                          handleEdit(business);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="수정"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      {businesses.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(business);
                          }}
                          className="p-1 hover:bg-red-100 rounded"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">새 비즈니스 추가</h2>
            <form onSubmit={handleSubmitCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비즈니스 이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="예: 카페 ABC"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명 (선택)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="비즈니스에 대한 간단한 설명"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && editingBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">비즈니스 수정</h2>
            <form onSubmit={handleSubmitEdit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비즈니스 이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명 (선택)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBusiness(null);
                  }}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

