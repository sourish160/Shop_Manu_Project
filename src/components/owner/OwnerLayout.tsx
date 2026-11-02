import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { insforge, Restaurant } from '../../lib/insforge';
import { OwnerSidebar } from './OwnerSidebar';
import { OwnerTopHeader } from './OwnerTopHeader';
import { MessageSquare, X, Mail, Clock } from 'lucide-react';

interface InquiryReport {
  id: string;
  restaurant_id: string;
  report_type: string;
  details: string;
  reporter_email: string | null;
  reporter_phone?: string | null;
  created_at: string;
  status?: string;
}

interface OwnerContextType {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  setCurrentRestaurant: (res: Restaurant) => void;
  inquiryCount: number;
  refreshRestaurants: () => Promise<void>;
  openInquiriesModal: () => void;
}

const OwnerContext = createContext<OwnerContextType | undefined>(undefined);

export const useOwner = (): OwnerContextType => {
  const context = useContext(OwnerContext);
  if (!context) {
    throw new Error('useOwner must be used within an OwnerLayout');
  }
  return context;
};

interface OwnerLayoutProps {
  children: React.ReactNode;
  activeRestaurantId?: string | null;
  onSelectRestaurant?: (restaurant: Restaurant) => void;
}

export const OwnerLayout: React.FC<OwnerLayoutProps> = ({
  children,
  activeRestaurantId: controlledResId,
  onSelectRestaurant: controlledOnSelect,
}) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Layout states
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [inquiries, setInquiries] = useState<InquiryReport[]>([]);
  const [showInquiriesModal, setShowInquiriesModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Freshness stats for header notifications
  const [freshnessAlerts, setFreshnessAlerts] = useState<{
    fresh: number;
    reviewRecommended: number;
    stale: number;
  }>({ fresh: 0, reviewRecommended: 0, stale: 0 });

  // Load restaurants
  const fetchRestaurants = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await insforge.database
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .order('name');

      if (!error && data) {
        const list = data as Restaurant[];
        setRestaurants(list);

        // Determine which restaurant to select
        const urlId = searchParams.get('restaurantId') || searchParams.get('id') || controlledResId;
        if (urlId && list.some((r) => r.id === urlId)) {
          setSelectedRestaurantId(urlId);
        } else if (list.length > 0 && !selectedRestaurantId) {
          setSelectedRestaurantId(list[0].id);
        }
      }
    } catch (err) {
      console.error('OwnerLayout: Failed to load restaurants', err);
    }
  }, [user, searchParams, controlledResId, selectedRestaurantId]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Sync controlled id
  useEffect(() => {
    if (controlledResId) {
      setSelectedRestaurantId(controlledResId);
    }
  }, [controlledResId]);

  const currentRestaurant = restaurants.find((r) => r.id === selectedRestaurantId) || restaurants[0] || null;

  // Handle selecting restaurant
  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurantId(restaurant.id);
    if (controlledOnSelect) {
      controlledOnSelect(restaurant);
    }
    // Update URL param if on a page that uses it
    const newParams = new URLSearchParams(searchParams);
    if (newParams.has('restaurantId')) {
      newParams.set('restaurantId', restaurant.id);
      setSearchParams(newParams);
    } else if (newParams.has('id')) {
      newParams.set('id', restaurant.id);
      setSearchParams(newParams);
    }
  };

  // Load inquiries count and freshness stats for current restaurant
  useEffect(() => {
    if (!currentRestaurant) return;

    let isMounted = true;
    const loadStats = async () => {
      try {
        // Inquiries
        const { data: inqData } = await insforge.database
          .from('restaurant_reports')
          .select('*')
          .eq('restaurant_id', currentRestaurant.id)
          .order('created_at', { ascending: false });

        if (isMounted && inqData) {
          setInquiries(inqData as InquiryReport[]);
        }

        // Foods for freshness
        const { data: foodData } = await insforge.database
          .from('foods')
          .select('updated_at')
          .eq('restaurant_id', currentRestaurant.id);

        if (isMounted && foodData) {
          const now = Date.now();
          let fresh = 0;
          let review = 0;
          let stale = 0;

          (foodData as { updated_at: string }[]).forEach((f) => {
            const days = Math.floor((now - new Date(f.updated_at).getTime()) / (1000 * 60 * 60 * 24));
            if (days < 30) fresh++;
            else if (days <= 60) review++;
            else stale++;
          });

          setFreshnessAlerts({ fresh, reviewRecommended: review, stale });
        }
      } catch (err) {
        console.error('OwnerLayout: Failed to load stats', err);
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [currentRestaurant]);

  const contextValue: OwnerContextType = {
    restaurants,
    currentRestaurant,
    setCurrentRestaurant: handleSelectRestaurant,
    inquiryCount: inquiries.length,
    refreshRestaurants: fetchRestaurants,
    openInquiriesModal: () => setShowInquiriesModal(true),
  };

  return (
    <OwnerContext.Provider value={contextValue}>
      <div className="min-h-screen bg-[#100D0B] text-[#F5EDE5] flex">
        {/* Fixed Dark Sidebar */}
        <OwnerSidebar
          restaurants={restaurants}
          currentRestaurant={currentRestaurant}
          onSelectRestaurant={handleSelectRestaurant}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          onOpenInquiriesModal={() => setShowInquiriesModal(true)}
          inquiryCount={inquiries.length}
        />

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Top Header */}
          <OwnerTopHeader
            currentRestaurant={currentRestaurant}
            onToggleMobileSidebar={() => setIsSidebarOpenMobile((prev) => !prev)}
            searchQuery={globalSearch}
            onSearchChange={setGlobalSearch}
            staleCount={freshnessAlerts.stale}
            reviewCount={freshnessAlerts.reviewRecommended}
          />

          {/* Page Body Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>

        {/* Global Orders & Customer Inquiries Modal */}
        {showInquiriesModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1C1512] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#382820] text-left">
              <div className="flex items-center justify-between pb-3 border-b border-[#382820]">
                <div className="flex items-center space-x-2.5">
                  <MessageSquare className="w-5 h-5 text-[#E9A052]" />
                  <h3 className="font-serif text-xl text-[#F5EDE5] font-normal">
                    Customer Inquiries &amp; Reports
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInquiriesModal(false)}
                  className="p-1 rounded-full text-[#B6A69A] hover:text-[#F5EDE5] hover:bg-[#241A15] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                {inquiries.length === 0 ? (
                  <div className="py-12 text-center text-[#B6A69A] font-sans space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-[#B6A69A]/40 stroke-[1.5]" />
                    <p className="text-sm">No customer inquiries or menu reports recorded yet.</p>
                    <p className="text-xs text-[#B6A69A]/70">
                      Feedback and price corrections submitted by diners will appear here in real time.
                    </p>
                  </div>
                ) : (
                  inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-3.5 rounded-2xl border border-[#382820] bg-[#241A15] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono uppercase font-bold px-2 py-0.5 rounded-md bg-[#E9A052]/15 text-[#E9A052] border border-[#E9A052]/30 text-[10px]">
                          {inq.report_type.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center text-[#B6A69A] text-[10px] space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(inq.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="font-sans text-[#F5EDE5] text-sm leading-relaxed">{inq.details}</p>
                      {inq.reporter_email && (
                        <div className="flex items-center space-x-1 text-[#B6A69A] font-mono text-[11px] pt-1 border-t border-[#382820]">
                          <Mail className="w-3 h-3 text-[#E9A052]" />
                          <span>{inq.reporter_email}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-[#382820] flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowInquiriesModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#241A15] border border-[#382820] text-[#F5EDE5] hover:bg-[#2C201A] hover:border-[#E9A052]/40 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OwnerContext.Provider>
  );
};
