import { Tour, TourCategory, ChatMessage } from './types';

export const TOURS: Tour[] = [
  { id: 1, title: "The Great Lagos Market Dive", imgClass: "bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80')]", category: "Culture", duration: "45m", views: "124k", trend: "+3.2k this week", isFree: true },
  { id: 2, title: "Lekki Conservation Centre Canopy Walk", imgClass: "bg-[url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80')]", category: "Nature", duration: "1h 15m", views: "280k", trend: "+15k this week", isFree: true },
  { id: 3, title: "Nightlife at Victoria Island", imgClass: "bg-[url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&q=80')]", category: "Entertainment", duration: "2h", views: "450k", trend: "+22k this week", isFree: true },
  { id: 4, title: "Historical Tour of Badagry", imgClass: "bg-[url('https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600&q=80')]", category: "History", duration: "1h 30m", views: "85k", trend: "+1.1k this week", isFree: true },
  { id: 5, title: "Tarkwa Bay Beach Day", imgClass: "bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80')]", category: "Relaxation", duration: "3h", views: "210k", trend: "+4k this week", isFree: true },
  { id: 6, title: "Makoko Floating Village", imgClass: "bg-[url('https://images.unsplash.com/photo-1576089073624-b5751a8f4e3b?w=600&q=80')]", category: "Culture", duration: "50m", views: "320k", trend: "+9k this week", isFree: true },
  { id: 7, title: "National Museum Virtual Walk", imgClass: "bg-[url('https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&q=80')]", category: "History", duration: "1h", views: "95k", trend: "+2k this week", isFree: true },
  { id: 8, title: "Eko Atlantic City Drive", imgClass: "bg-[url('https://images.unsplash.com/photo-1558618047-f4e60cefab14?w=600&q=80')]", category: "Modern", duration: "40m", views: "150k", trend: "+5k this week", isFree: true },
];

export const CATS: TourCategory[] = ["All", "Culture", "Nature", "History", "Entertainment", "Relaxation", "Modern"];

export const CHAT: ChatMessage[] = [
  { user: "Host (Lagos Rhythm)", msg: "Welcome everyone! We are about to begin our journey through the Lekki Conservation Centre. Feel free to ask questions here!", pinned: true, time: "10:02" },
  { user: "Amina", msg: "So excited for this tour!", time: "10:02" },
  { user: "David_K", msg: "I visited there last year, absolutely beautiful.", time: "10:03" },
  { user: "Sarah", msg: "Is the canopy walk open today?", time: "10:04" },
  { user: "TravelBug", msg: "Can't wait to see the monkeys!", time: "10:05" },
  { user: "Ngozi", msg: "Beautiful morning in Lagos!", time: "10:05" },
];

export const CATEGORY_STYLES: Record<string, string> = {
  Culture: "bg-white text-dark shadow-sm border border-border/50",
  Nature: "bg-white text-dark shadow-sm border border-border/50",
  Entertainment: "bg-white text-dark shadow-sm border border-border/50",
  History: "bg-white text-dark shadow-sm border border-border/50",
  Relaxation: "bg-white text-dark shadow-sm border border-border/50",
  Modern: "bg-white text-dark shadow-sm border border-border/50",
};
