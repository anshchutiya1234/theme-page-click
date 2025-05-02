
export interface SubPartner {
  id: string;
  username: string;
  partnerCode: string;
  joinDate: string;
  totalClicks: number;
  bonusClicksEarned: number;
  status: 'active' | 'inactive';
}
