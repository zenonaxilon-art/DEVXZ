-- SQL script to setup the Roblox Marketplace database on Supabase
-- Copy and run this in your Supabase SQL Editor

-- 1. Create Tables
CREATE TABLE public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    roblox_id TEXT UNIQUE,
    username TEXT NOT NULL UNIQUE,
    avatar TEXT,
    verified BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL CHECK (price >= 0),
    seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED
);

CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    proof_image_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Setup Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Users RLS
CREATE POLICY "Public read for verified or regular users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Products RLS
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Users can insert their own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- Orders RLS
CREATE POLICY "Users can see their own orders (buyer or seller)" ON public.orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() IN (SELECT seller_id FROM public.products WHERE id = product_id));
CREATE POLICY "Users can insert orders as buyer" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Admins or seller can update status" ON public.orders FOR UPDATE USING (auth.uid() IN (SELECT seller_id FROM public.products WHERE id = product_id) OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Messages RLS
CREATE POLICY "Users can select messages they sent or received" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert messages as sender" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Verification Requests RLS
CREATE POLICY "Users can select their own verification requests" ON public.verification_requests FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Users can insert their own verification requests" ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update verification requests" ON public.verification_requests FOR UPDATE USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 3. Database Functions & Triggers
-- Function to automatically create a user profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, avatar)
  VALUES (new.id, new.email, 'https://cdn.discordapp.com/embed/avatars/0.png');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Enable Supabase Realtime for Messages
alter publication supabase_realtime add table public.messages;
