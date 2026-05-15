--
-- PostgreSQL database dump
--

\restrict qlQ2KzanqDWxBEzSZ4A37eMyEI1ckfmgJr9bfPKOxqhjsUSse6ZArdqH6DiO9Bs

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-13 14:09:37

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;



--
-- TOC entry 5611 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 1018 (class 1247 OID 17288)
-- Name: placement_hold_item_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.placement_hold_item_status AS ENUM (
    'active',
    'expired',
    'converted',
    'cancelled',
    'released'
);



--
-- TOC entry 1015 (class 1247 OID 17276)
-- Name: placement_hold_session_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.placement_hold_session_status AS ENUM (
    'active',
    'expired',
    'converted',
    'cancelled',
    'released'
);



--
-- TOC entry 1009 (class 1247 OID 17258)
-- Name: placement_inventory_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.placement_inventory_mode AS ENUM (
    'slot_based',
    'unlimited',
    'entitlement'
);



--
-- TOC entry 1024 (class 1247 OID 17312)
-- Name: placement_payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.placement_payment_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
);



--
-- TOC entry 1006 (class 1247 OID 17248)
-- Name: placement_pricing_model; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.placement_pricing_model AS ENUM (
    'flat',
    'per_day',
    'per_week',
    'per_campaign'
);



--
-- TOC entry 1003 (class 1247 OID 17240)
-- Name: placement_product_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.placement_product_type AS ENUM (
    'slot_based',
    'event_addon',
    'entitlement'
);



--
-- TOC entry 994 (class 1247 OID 17186)
-- Name: placement_publication_approval_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.placement_publication_approval_status AS ENUM (
    'approved',
    'pending_creative',
    'rejected'
);



--
-- TOC entry 991 (class 1247 OID 17174)
-- Name: placement_publication_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.placement_publication_status AS ENUM (
    'scheduled',
    'active',
    'completed',
    'cancelled',
    'paused'
);



--
-- TOC entry 1021 (class 1247 OID 17300)
-- Name: placement_reservation_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.placement_reservation_status AS ENUM (
    'reserved',
    'active',
    'completed',
    'cancelled',
    'refunded'
);



--
-- TOC entry 1000 (class 1247 OID 17232)
-- Name: placement_surface_channel_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.placement_surface_channel_type AS ENUM (
    'website',
    'app',
    'portal'
);



--
-- TOC entry 1012 (class 1247 OID 17266)
-- Name: placement_window_unit; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.placement_window_unit AS ENUM (
    'day',
    'week',
    'month',
    'campaign_period'
);



--
-- TOC entry 291 (class 1255 OID 16850)
-- Name: set_platform_users_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_platform_users_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



--
-- TOC entry 292 (class 1255 OID 17229)
-- Name: set_updated_at_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;



SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 242 (class 1259 OID 17051)
-- Name: ad_campaign_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ad_campaign_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid NOT NULL,
    inventory_id uuid,
    placement_type character varying(50) NOT NULL,
    placement_date date NOT NULL,
    slot_number integer,
    quantity integer DEFAULT 1 NOT NULL,
    status character varying(50) DEFAULT 'reserved'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    region_code character varying(40) DEFAULT 'USA'::character varying
);



--
-- TOC entry 241 (class 1259 OID 17035)
-- Name: ad_campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ad_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_name character varying(255) NOT NULL,
    organization_name character varying(255) NOT NULL,
    contact_email character varying(255) NOT NULL,
    goal text,
    notes text,
    created_by uuid,
    status character varying(50) DEFAULT 'reserved'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    linked_event_id uuid,
    org_uuid text,
    source text,
    updated_at timestamp without time zone
);



--
-- TOC entry 250 (class 1259 OID 17533)
-- Name: campaign_promo_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campaign_promo_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid NOT NULL,
    campaign_item_id uuid NOT NULL,
    placement_type character varying(50) NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    mime_type character varying(150),
    file_size integer,
    moderation_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    uploaded_by_user_id uuid,
    uploaded_by_org_uuid uuid,
    source character varying(100),
    rejection_reason text,
    approved_by_user_id uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT campaign_promo_media_moderation_status_check CHECK (((moderation_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);



--
-- TOC entry 238 (class 1259 OID 16945)
-- Name: event_action_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_action_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    event_code character varying(50),
    action_type character varying(50) NOT NULL,
    action_status character varying(30) NOT NULL,
    actor_user_id uuid,
    actor_role character varying(50),
    message text,
    error_detail text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 221 (class 1259 OID 16447)
-- Name: event_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(60) NOT NULL,
    label character varying(120) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 229 (class 1259 OID 16635)
-- Name: event_discovery_index; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_discovery_index (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    occurrence_id uuid,
    event_code character varying(40),
    status character varying(20) NOT NULL,
    title character varying(180) NOT NULL,
    short_description character varying(300),
    description text,
    category_key character varying(60),
    sponsor_name character varying(180),
    city character varying(120),
    state_region character varying(120),
    country character varying(120),
    country_code character(2),
    timezone character varying(80),
    starts_at_utc timestamp with time zone NOT NULL,
    ends_at_utc timestamp with time zone,
    occurrence_date date NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    is_virtual boolean DEFAULT false NOT NULL,
    search_document tsvector,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sponsor_logo_url text,
    media_url text
);



--
-- TOC entry 251 (class 1259 OID 17573)
-- Name: event_engagement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_engagement (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    event_code text,
    action_type character varying(50) NOT NULL,
    source character varying(100),
    user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 240 (class 1259 OID 16992)
-- Name: event_featured_placements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_featured_placements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    inventory_id uuid NOT NULL,
    placement_status text DEFAULT 'reserved'::text NOT NULL,
    reserved_at timestamp without time zone DEFAULT now() NOT NULL,
    approved_at timestamp without time zone,
    starts_at timestamp without time zone,
    ends_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT placement_status_valid CHECK ((placement_status = ANY (ARRAY['reserved'::text, 'active'::text, 'expired'::text, 'cancelled'::text])))
);



--
-- TOC entry 224 (class 1259 OID 16524)
-- Name: event_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    venue_name character varying(180),
    address_line_1 character varying(180),
    address_line_2 character varying(180),
    city character varying(120) NOT NULL,
    state_region character varying(120),
    postal_code character varying(40),
    country character varying(120) NOT NULL,
    country_code character(2),
    latitude numeric(9,6),
    longitude numeric(9,6),
    timezone character varying(80) NOT NULL,
    formatted_location character varying(300),
    is_virtual boolean DEFAULT false NOT NULL,
    virtual_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 232 (class 1259 OID 16757)
-- Name: event_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    media_type character varying(20) DEFAULT 'image'::character varying NOT NULL,
    file_url text NOT NULL,
    file_name text,
    mime_type text,
    file_size_bytes integer,
    is_primary boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    moderation_status character varying(30) DEFAULT 'pending_review'::character varying NOT NULL,
    moderation_reason text,
    moderation_reviewed_at timestamp without time zone,
    moderation_reviewed_by uuid,
    updated_at timestamp without time zone DEFAULT now()
);



--
-- TOC entry 228 (class 1259 OID 16609)
-- Name: event_occurrences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_occurrences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    occurrence_date date NOT NULL,
    starts_at_utc timestamp with time zone NOT NULL,
    ends_at_utc timestamp with time zone,
    timezone character varying(80) NOT NULL,
    local_start_date date NOT NULL,
    local_end_date date,
    local_start_time time without time zone NOT NULL,
    local_end_time time without time zone,
    city character varying(120),
    state_region character varying(120),
    country character varying(120),
    country_code character(2),
    is_cancelled boolean DEFAULT false NOT NULL,
    is_exception boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 237 (class 1259 OID 16913)
-- Name: event_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    payment_status character varying(20) NOT NULL,
    payment_provider character varying(50) DEFAULT 'stripe'::character varying NOT NULL,
    amount_cents integer NOT NULL,
    currency character varying(10) DEFAULT 'usd'::character varying NOT NULL,
    checkout_session_id character varying(255),
    payment_intent_id character varying(255),
    customer_email character varying(255),
    paid_at timestamp without time zone,
    failed_at timestamp without time zone,
    refunded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT event_payments_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['unpaid'::character varying, 'pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying, 'waived'::character varying])::text[])))
);



--
-- TOC entry 253 (class 1259 OID 17626)
-- Name: event_promotions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_promotions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    placement_type text NOT NULL,
    starts_at timestamp without time zone NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    purchase_type text
);



--
-- TOC entry 230 (class 1259 OID 16667)
-- Name: event_review_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_review_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    admin_user_id uuid NOT NULL,
    action_type character varying(40) NOT NULL,
    notes text,
    diff jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 223 (class 1259 OID 16497)
-- Name: event_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    schedule_type character varying(20) NOT NULL,
    timezone character varying(80),
    start_date date NOT NULL,
    end_date date,
    start_time time without time zone NOT NULL,
    end_time time without time zone,
    is_all_day boolean DEFAULT false NOT NULL,
    recurrence_interval integer DEFAULT 1 NOT NULL,
    recurrence_until date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    monthly_mode character varying(30),
    monthly_day integer,
    monthly_week integer,
    monthly_weekday character varying(2),
    recurrence_rule text,
    schedule_timezone character varying(100) DEFAULT 'UTC'::character varying NOT NULL,
    recurrence_days text[],
    CONSTRAINT event_schedules_schedule_type_check CHECK (((schedule_type)::text = ANY ((ARRAY['one_time'::character varying, 'recurring_weekly'::character varying, 'recurring_monthly'::character varying])::text[])))
);



--
-- TOC entry 225 (class 1259 OID 16548)
-- Name: event_sponsors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_sponsors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    sponsor_type character varying(30) NOT NULL,
    sponsor_name character varying(180) NOT NULL,
    contact_name character varying(160),
    contact_email character varying(320),
    contact_phone character varying(50),
    website_url text,
    instagram_url text,
    facebook_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    logo_url text
);



--
-- TOC entry 227 (class 1259 OID 16591)
-- Name: event_status_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    from_status character varying(20),
    to_status character varying(20) NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 233 (class 1259 OID 16787)
-- Name: event_submission_media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_submission_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_submission_id uuid NOT NULL,
    media_role character varying(50) DEFAULT 'hero'::character varying NOT NULL,
    media_type character varying(50) DEFAULT 'image'::character varying NOT NULL,
    media_url text NOT NULL,
    alt_text text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    moderation_status character varying(20) DEFAULT 'pending'::character varying NOT NULL
);



--
-- TOC entry 222 (class 1259 OID 16464)
-- Name: event_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_user_id uuid,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    event_code character varying(40),
    title character varying(180) NOT NULL,
    slug character varying(220),
    short_description character varying(300),
    description text NOT NULL,
    category_id uuid,
    event_type character varying(20) NOT NULL,
    cover_image_url text,
    banner_image_url text,
    livestream_url text,
    external_url text,
    submitter_name character varying(160),
    submitter_email character varying(320) NOT NULL,
    submitter_phone character varying(50),
    email_verified_for_submission boolean DEFAULT false NOT NULL,
    approved_at timestamp with time zone,
    rejected_at timestamp with time zone,
    rejection_reason text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    otp_code text,
    otp_expires_at timestamp without time zone,
    featured boolean DEFAULT false,
    org_uuid uuid,
    payment_status character varying(20) DEFAULT 'unpaid'::character varying NOT NULL,
    payment_amount_cents integer DEFAULT 7900 NOT NULL,
    payment_currency character varying(10) DEFAULT 'usd'::character varying NOT NULL,
    payment_reference character varying(255),
    payment_provider character varying(50) DEFAULT 'stripe'::character varying,
    payment_paid_at timestamp without time zone,
    payment_failed_at timestamp without time zone,
    payment_updated_at timestamp without time zone DEFAULT now() NOT NULL,
    rejected_by uuid,
    has_featured_badge boolean DEFAULT false,
    has_featured_placement boolean DEFAULT false,
    pricing_total_cents integer,
    pricing_currency text DEFAULT 'usd'::text,
    pricing_breakdown jsonb,
    featured_placement_status text DEFAULT 'requested'::text,
    featured_placement_inventory_id uuid,
    is_major_event boolean DEFAULT false,
    waive_event_payment boolean DEFAULT false NOT NULL,
    CONSTRAINT event_submissions_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['unpaid'::character varying, 'pending'::character varying, 'paid'::character varying, 'failed'::character varying, 'refunded'::character varying, 'waived'::character varying])::text[]))),
    CONSTRAINT featured_placement_status_valid CHECK ((featured_placement_status = ANY (ARRAY['requested'::text, 'reserved'::text, 'active'::text, 'expired'::text, 'cancelled'::text]))),
    CONSTRAINT pricing_total_non_negative CHECK (((pricing_total_cents IS NULL) OR (pricing_total_cents >= 0)))
);



--
-- TOC entry 220 (class 1259 OID 16427)
-- Name: event_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_users (
    id uuid DEFAULT gen_random_uuid() CONSTRAINT users_id_not_null NOT NULL,
    email character varying(320) CONSTRAINT users_email_not_null NOT NULL,
    email_verified boolean DEFAULT false CONSTRAINT users_email_verified_not_null NOT NULL,
    profile_name character varying(120),
    full_name character varying(160),
    password_hash text,
    role character varying(30) DEFAULT 'user'::character varying CONSTRAINT users_role_not_null NOT NULL,
    created_at timestamp with time zone DEFAULT now() CONSTRAINT users_created_at_not_null NOT NULL,
    updated_at timestamp with time zone DEFAULT now() CONSTRAINT users_updated_at_not_null NOT NULL,
    is_active boolean DEFAULT true CONSTRAINT users_is_active_not_null NOT NULL,
    two_factor_enabled boolean DEFAULT false CONSTRAINT users_two_factor_enabled_not_null NOT NULL,
    last_login_at timestamp without time zone,
    created_by uuid,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'sysadmin'::character varying, 'exec_sysadmin'::character varying])::text[])))
);



--
-- TOC entry 226 (class 1259 OID 16569)
-- Name: event_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    email character varying(320) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    attempt_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    otp_code character varying(6),
    verified boolean DEFAULT false
);



--
-- TOC entry 231 (class 1259 OID 16691)
-- Name: featured_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.featured_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone,
    sort_order integer DEFAULT 0 NOT NULL,
    created_by_user_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 239 (class 1259 OID 16968)
-- Name: featured_placement_inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.featured_placement_inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    placement_key text NOT NULL,
    placement_name text NOT NULL,
    page_name text NOT NULL,
    slot_position integer NOT NULL,
    price_cents integer NOT NULL,
    currency text DEFAULT 'usd'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    starts_at_utc timestamp with time zone,
    ends_at_utc timestamp with time zone,
    placement_type character varying(50),
    duration_days integer DEFAULT 7,
    region_code character varying(40) DEFAULT 'USA'::character varying
);



--
-- TOC entry 236 (class 1259 OID 16865)
-- Name: organization_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_accounts (
    id bigint NOT NULL,
    org_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_name character varying(255) NOT NULL,
    organization_type character varying(100),
    contact_name character varying(255),
    contact_email character varying(255),
    contact_phone character varying(50),
    city character varying(120),
    state_region character varying(120),
    country character varying(120),
    website_url text,
    instagram_url text,
    logo_url text,
    logo_source character varying(50) DEFAULT 'event_submission'::character varying,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    verification_status character varying(30) DEFAULT 'unverified'::character varying NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_admin_id uuid,
    owner_user_id uuid,
    street_address text,
    subscription_status text,
    subscription_expires_at timestamp with time zone,
    subscription_region text,
    subscription_price_cents integer,
    subscription_currency text,
    subscription_checkout_session_id text,
    subscription_payment_intent_id text,
    subscription_started_at timestamp without time zone,
    created_by_admin boolean DEFAULT false,
    CONSTRAINT organization_accounts_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'suspended'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT organization_accounts_verification_check CHECK (((verification_status)::text = ANY ((ARRAY['unverified'::character varying, 'verified'::character varying])::text[])))
);



--
-- TOC entry 235 (class 1259 OID 16864)
-- Name: organization_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.organization_accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 5612 (class 0 OID 0)
-- Dependencies: 235
-- Name: organization_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.organization_accounts_id_seq OWNED BY public.organization_accounts.id;


--
-- TOC entry 248 (class 1259 OID 17423)
-- Name: placement_hold_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.placement_hold_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hold_session_id uuid NOT NULL,
    placement_product_id uuid NOT NULL,
    window_start_date date NOT NULL,
    window_end_date date NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    held_price_cents integer DEFAULT 0 NOT NULL,
    status public.placement_hold_item_status DEFAULT 'active'::public.placement_hold_item_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_placement_hold_items_price_nonnegative CHECK ((held_price_cents >= 0)),
    CONSTRAINT chk_placement_hold_items_quantity_positive CHECK ((quantity > 0)),
    CONSTRAINT chk_placement_hold_items_window CHECK ((window_end_date >= window_start_date))
);



--
-- TOC entry 247 (class 1259 OID 17401)
-- Name: placement_hold_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.placement_hold_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hold_token character varying(120) NOT NULL,
    user_id uuid,
    org_id uuid,
    event_id uuid,
    status public.placement_hold_session_status DEFAULT 'active'::public.placement_hold_session_status NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    checkout_session_id character varying(255),
    currency character varying(10) DEFAULT 'usd'::character varying NOT NULL,
    total_amount_cents integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_placement_hold_sessions_total_amount_nonnegative CHECK ((total_amount_cents >= 0))
);



--
-- TOC entry 246 (class 1259 OID 17369)
-- Name: placement_inventory_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.placement_inventory_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    placement_product_id uuid NOT NULL,
    inventory_mode public.placement_inventory_mode NOT NULL,
    slot_count integer,
    window_unit public.placement_window_unit NOT NULL,
    window_size integer DEFAULT 1 NOT NULL,
    hold_duration_minutes integer DEFAULT 15 NOT NULL,
    advance_booking_limit_days integer,
    max_quantity_per_checkout integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_placement_inventory_rules_advance_booking_nonnegative CHECK (((advance_booking_limit_days IS NULL) OR (advance_booking_limit_days >= 0))),
    CONSTRAINT chk_placement_inventory_rules_hold_duration_positive CHECK ((hold_duration_minutes > 0)),
    CONSTRAINT chk_placement_inventory_rules_max_quantity_positive CHECK (((max_quantity_per_checkout IS NULL) OR (max_quantity_per_checkout > 0))),
    CONSTRAINT chk_placement_inventory_rules_slot_count_positive CHECK (((slot_count IS NULL) OR (slot_count > 0))),
    CONSTRAINT chk_placement_inventory_rules_window_size_positive CHECK ((window_size > 0))
);



--
-- TOC entry 245 (class 1259 OID 17339)
-- Name: placement_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.placement_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    surface_id uuid NOT NULL,
    code character varying(120) NOT NULL,
    name character varying(180) NOT NULL,
    placement_type public.placement_product_type NOT NULL,
    pricing_model public.placement_pricing_model NOT NULL,
    default_price_cents integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_placement_products_price_nonnegative CHECK ((default_price_cents >= 0)),
    CONSTRAINT chk_placement_products_sort_order_nonnegative CHECK ((sort_order >= 0))
);



--
-- TOC entry 243 (class 1259 OID 17193)
-- Name: placement_publications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.placement_publications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reservation_id uuid,
    event_id uuid NOT NULL,
    placement_product_id uuid NOT NULL,
    surface_id uuid NOT NULL,
    placement_code character varying(120) NOT NULL,
    display_title character varying(255) NOT NULL,
    display_subtitle character varying(255),
    display_image_url text,
    display_cta_label character varying(80),
    display_cta_url text NOT NULL,
    window_start_date date NOT NULL,
    window_end_date date NOT NULL,
    publication_status public.placement_publication_status DEFAULT 'scheduled'::public.placement_publication_status NOT NULL,
    approval_status public.placement_publication_approval_status DEFAULT 'approved'::public.placement_publication_approval_status NOT NULL,
    slot_number integer,
    priority_score integer DEFAULT 0,
    source_event_title character varying(255),
    source_sponsor_name character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_placement_publications_priority_nonnegative CHECK ((priority_score >= 0)),
    CONSTRAINT chk_placement_publications_slot_positive CHECK (((slot_number IS NULL) OR (slot_number > 0))),
    CONSTRAINT chk_placement_publications_window CHECK ((window_end_date >= window_start_date))
);



--
-- TOC entry 249 (class 1259 OID 17458)
-- Name: placement_reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.placement_reservations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reservation_code character varying(120) NOT NULL,
    hold_session_id uuid,
    hold_item_id uuid,
    user_id uuid,
    org_id uuid,
    event_id uuid,
    placement_product_id uuid NOT NULL,
    window_start_date date NOT NULL,
    window_end_date date NOT NULL,
    slot_number integer,
    quantity integer DEFAULT 1 NOT NULL,
    price_cents integer DEFAULT 0 NOT NULL,
    currency character varying(10) DEFAULT 'usd'::character varying NOT NULL,
    payment_status public.placement_payment_status DEFAULT 'pending'::public.placement_payment_status NOT NULL,
    reservation_status public.placement_reservation_status DEFAULT 'reserved'::public.placement_reservation_status NOT NULL,
    stripe_checkout_session_id character varying(255),
    stripe_payment_intent_id character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_placement_reservations_price_nonnegative CHECK ((price_cents >= 0)),
    CONSTRAINT chk_placement_reservations_quantity_positive CHECK ((quantity > 0)),
    CONSTRAINT chk_placement_reservations_slot_positive CHECK (((slot_number IS NULL) OR (slot_number > 0))),
    CONSTRAINT chk_placement_reservations_window CHECK ((window_end_date >= window_start_date))
);



--
-- TOC entry 244 (class 1259 OID 17321)
-- Name: placement_surfaces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.placement_surfaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(150) NOT NULL,
    channel_type public.placement_surface_channel_type NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);



--
-- TOC entry 234 (class 1259 OID 16820)
-- Name: platform_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    dob_month smallint NOT NULL,
    dob_year smallint NOT NULL,
    city character varying(120),
    state_region character varying(120),
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role character varying(30) DEFAULT 'user'::character varying NOT NULL,
    is_email_verified boolean DEFAULT false NOT NULL,
    two_factor_enabled boolean DEFAULT true NOT NULL,
    two_factor_code character varying(10),
    two_factor_expires_at timestamp with time zone,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT platform_users_dob_month_check CHECK (((dob_month >= 1) AND (dob_month <= 12))),
    CONSTRAINT platform_users_dob_year_check CHECK (((dob_year >= 1900) AND (dob_year <= (EXTRACT(year FROM CURRENT_DATE))::integer))),
    CONSTRAINT platform_users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'sysadmin'::character varying, 'execsysadmin'::character varying])::text[])))
);



--
-- TOC entry 252 (class 1259 OID 17605)
-- Name: user_notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_notification_preferences (
    user_id uuid NOT NULL,
    email_enabled boolean DEFAULT true,
    new_events_enabled boolean DEFAULT true,
    preferred_city character varying,
    preferred_state_region character varying,
    notification_days text[] DEFAULT ARRAY['wednesday'::text, 'saturday'::text],
    notification_time time without time zone DEFAULT '18:00:00'::time without time zone,
    max_event_cards integer DEFAULT 3,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);



--
-- TOC entry 5138 (class 2604 OID 16868)
-- Name: organization_accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_accounts ALTER COLUMN id SET DEFAULT nextval('public.organization_accounts_id_seq'::regclass);


--
-- TOC entry 5355 (class 2606 OID 17067)
-- Name: ad_campaign_items ad_campaign_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_campaign_items
    ADD CONSTRAINT ad_campaign_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5353 (class 2606 OID 17050)
-- Name: ad_campaigns ad_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_pkey PRIMARY KEY (id);


--
-- TOC entry 5399 (class 2606 OID 17555)
-- Name: campaign_promo_media campaign_promo_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_promo_media
    ADD CONSTRAINT campaign_promo_media_pkey PRIMARY KEY (id);


--
-- TOC entry 5339 (class 2606 OID 16959)
-- Name: event_action_logs event_action_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_action_logs
    ADD CONSTRAINT event_action_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5269 (class 2606 OID 16463)
-- Name: event_categories event_categories_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_categories
    ADD CONSTRAINT event_categories_key_key UNIQUE (key);


--
-- TOC entry 5271 (class 2606 OID 16461)
-- Name: event_categories event_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_categories
    ADD CONSTRAINT event_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 5307 (class 2606 OID 16656)
-- Name: event_discovery_index event_discovery_index_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_discovery_index
    ADD CONSTRAINT event_discovery_index_pkey PRIMARY KEY (id);


--
-- TOC entry 5407 (class 2606 OID 17585)
-- Name: event_engagement event_engagement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_engagement
    ADD CONSTRAINT event_engagement_pkey PRIMARY KEY (id);


--
-- TOC entry 5349 (class 2606 OID 17010)
-- Name: event_featured_placements event_featured_placements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_featured_placements
    ADD CONSTRAINT event_featured_placements_pkey PRIMARY KEY (id);


--
-- TOC entry 5288 (class 2606 OID 16542)
-- Name: event_locations event_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_locations
    ADD CONSTRAINT event_locations_pkey PRIMARY KEY (id);


--
-- TOC entry 5319 (class 2606 OID 16773)
-- Name: event_media event_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_media
    ADD CONSTRAINT event_media_pkey PRIMARY KEY (id);


--
-- TOC entry 5302 (class 2606 OID 16629)
-- Name: event_occurrences event_occurrences_event_id_starts_at_utc_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_occurrences
    ADD CONSTRAINT event_occurrences_event_id_starts_at_utc_key UNIQUE (event_id, starts_at_utc);


--
-- TOC entry 5304 (class 2606 OID 16627)
-- Name: event_occurrences event_occurrences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_occurrences
    ADD CONSTRAINT event_occurrences_pkey PRIMARY KEY (id);


--
-- TOC entry 5335 (class 2606 OID 16932)
-- Name: event_payments event_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_payments
    ADD CONSTRAINT event_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 5415 (class 2606 OID 17642)
-- Name: event_promotions event_promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_promotions
    ADD CONSTRAINT event_promotions_pkey PRIMARY KEY (id);


--
-- TOC entry 5313 (class 2606 OID 16680)
-- Name: event_review_actions event_review_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_review_actions
    ADD CONSTRAINT event_review_actions_pkey PRIMARY KEY (id);


--
-- TOC entry 5280 (class 2606 OID 16785)
-- Name: event_schedules event_schedules_event_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_schedules
    ADD CONSTRAINT event_schedules_event_id_key UNIQUE (event_id);


--
-- TOC entry 5282 (class 2606 OID 16518)
-- Name: event_schedules event_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_schedules
    ADD CONSTRAINT event_schedules_pkey PRIMARY KEY (id);


--
-- TOC entry 5293 (class 2606 OID 16563)
-- Name: event_sponsors event_sponsors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_sponsors
    ADD CONSTRAINT event_sponsors_pkey PRIMARY KEY (id);


--
-- TOC entry 5300 (class 2606 OID 16603)
-- Name: event_status_history event_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_status_history
    ADD CONSTRAINT event_status_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5322 (class 2606 OID 16807)
-- Name: event_submission_media event_submission_media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_submission_media
    ADD CONSTRAINT event_submission_media_pkey PRIMARY KEY (id);


--
-- TOC entry 5273 (class 2606 OID 16486)
-- Name: event_submissions event_submissions_event_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_submissions
    ADD CONSTRAINT event_submissions_event_code_key UNIQUE (event_code);


--
-- TOC entry 5275 (class 2606 OID 16484)
-- Name: event_submissions event_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_submissions
    ADD CONSTRAINT event_submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 5298 (class 2606 OID 16585)
-- Name: event_verifications event_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_verifications
    ADD CONSTRAINT event_verifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5315 (class 2606 OID 16705)
-- Name: featured_events featured_events_event_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_event_id_key UNIQUE (event_id);


--
-- TOC entry 5317 (class 2606 OID 16703)
-- Name: featured_events featured_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_pkey PRIMARY KEY (id);


--
-- TOC entry 5344 (class 2606 OID 16989)
-- Name: featured_placement_inventory featured_placement_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.featured_placement_inventory
    ADD CONSTRAINT featured_placement_inventory_pkey PRIMARY KEY (id);


--
-- TOC entry 5346 (class 2606 OID 16991)
-- Name: featured_placement_inventory featured_placement_inventory_placement_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.featured_placement_inventory
    ADD CONSTRAINT featured_placement_inventory_placement_key_key UNIQUE (placement_key);


--
-- TOC entry 5331 (class 2606 OID 16889)
-- Name: organization_accounts organization_accounts_org_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_accounts
    ADD CONSTRAINT organization_accounts_org_uuid_key UNIQUE (org_uuid);


--
-- TOC entry 5333 (class 2606 OID 16887)
-- Name: organization_accounts organization_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_accounts
    ADD CONSTRAINT organization_accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 5388 (class 2606 OID 17446)
-- Name: placement_hold_items placement_hold_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_hold_items
    ADD CONSTRAINT placement_hold_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5383 (class 2606 OID 17422)
-- Name: placement_hold_sessions placement_hold_sessions_hold_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_hold_sessions
    ADD CONSTRAINT placement_hold_sessions_hold_token_key UNIQUE (hold_token);


--
-- TOC entry 5385 (class 2606 OID 17420)
-- Name: placement_hold_sessions placement_hold_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_hold_sessions
    ADD CONSTRAINT placement_hold_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5377 (class 2606 OID 17393)
-- Name: placement_inventory_rules placement_inventory_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_inventory_rules
    ADD CONSTRAINT placement_inventory_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 5379 (class 2606 OID 17395)
-- Name: placement_inventory_rules placement_inventory_rules_placement_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_inventory_rules
    ADD CONSTRAINT placement_inventory_rules_placement_product_id_key UNIQUE (placement_product_id);


--
-- TOC entry 5373 (class 2606 OID 17363)
-- Name: placement_products placement_products_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_products
    ADD CONSTRAINT placement_products_code_key UNIQUE (code);


--
-- TOC entry 5375 (class 2606 OID 17361)
-- Name: placement_products placement_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_products
    ADD CONSTRAINT placement_products_pkey PRIMARY KEY (id);


--
-- TOC entry 5362 (class 2606 OID 17221)
-- Name: placement_publications placement_publications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_publications
    ADD CONSTRAINT placement_publications_pkey PRIMARY KEY (id);


--
-- TOC entry 5394 (class 2606 OID 17488)
-- Name: placement_reservations placement_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_reservations
    ADD CONSTRAINT placement_reservations_pkey PRIMARY KEY (id);


--
-- TOC entry 5396 (class 2606 OID 17490)
-- Name: placement_reservations placement_reservations_reservation_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_reservations
    ADD CONSTRAINT placement_reservations_reservation_code_key UNIQUE (reservation_code);


--
-- TOC entry 5367 (class 2606 OID 17338)
-- Name: placement_surfaces placement_surfaces_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_surfaces
    ADD CONSTRAINT placement_surfaces_code_key UNIQUE (code);


--
-- TOC entry 5369 (class 2606 OID 17336)
-- Name: placement_surfaces placement_surfaces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_surfaces
    ADD CONSTRAINT placement_surfaces_pkey PRIMARY KEY (id);


--
-- TOC entry 5324 (class 2606 OID 16849)
-- Name: platform_users platform_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_email_key UNIQUE (email);


--
-- TOC entry 5326 (class 2606 OID 16847)
-- Name: platform_users platform_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_users
    ADD CONSTRAINT platform_users_pkey PRIMARY KEY (id);


--
-- TOC entry 5417 (class 2606 OID 17644)
-- Name: event_promotions unique_event_placement; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_promotions
    ADD CONSTRAINT unique_event_placement UNIQUE (event_id, placement_type);


--
-- TOC entry 5290 (class 2606 OID 16897)
-- Name: event_locations uq_event_locations_event_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_locations
    ADD CONSTRAINT uq_event_locations_event_id UNIQUE (event_id);


--
-- TOC entry 5285 (class 2606 OID 16895)
-- Name: event_schedules uq_event_schedules_event_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_schedules
    ADD CONSTRAINT uq_event_schedules_event_id UNIQUE (event_id);


--
-- TOC entry 5295 (class 2606 OID 16899)
-- Name: event_sponsors uq_event_sponsors_event_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_sponsors
    ADD CONSTRAINT uq_event_sponsors_event_id UNIQUE (event_id);


--
-- TOC entry 5413 (class 2606 OID 17619)
-- Name: user_notification_preferences user_notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5265 (class 2606 OID 16446)
-- Name: event_users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5267 (class 2606 OID 16444)
-- Name: event_users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5286 (class 1259 OID 16900)
-- Name: event_locations_event_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX event_locations_event_id_key ON public.event_locations USING btree (event_id);


--
-- TOC entry 5291 (class 1259 OID 16901)
-- Name: event_sponsors_event_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX event_sponsors_event_id_key ON public.event_sponsors USING btree (event_id);


--
-- TOC entry 5296 (class 1259 OID 16902)
-- Name: event_verifications_event_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX event_verifications_event_id_key ON public.event_verifications USING btree (event_id);


--
-- TOC entry 5400 (class 1259 OID 17570)
-- Name: idx_campaign_promo_media_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaign_promo_media_active ON public.campaign_promo_media USING btree (is_active);


--
-- TOC entry 5401 (class 1259 OID 17566)
-- Name: idx_campaign_promo_media_campaign_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaign_promo_media_campaign_id ON public.campaign_promo_media USING btree (campaign_id);


--
-- TOC entry 5402 (class 1259 OID 17567)
-- Name: idx_campaign_promo_media_campaign_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaign_promo_media_campaign_item_id ON public.campaign_promo_media USING btree (campaign_item_id);


--
-- TOC entry 5403 (class 1259 OID 17569)
-- Name: idx_campaign_promo_media_moderation_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaign_promo_media_moderation_status ON public.campaign_promo_media USING btree (moderation_status);


--
-- TOC entry 5404 (class 1259 OID 17568)
-- Name: idx_campaign_promo_media_placement_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_campaign_promo_media_placement_type ON public.campaign_promo_media USING btree (placement_type);


--
-- TOC entry 5308 (class 1259 OID 16719)
-- Name: idx_discovery_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_discovery_featured ON public.event_discovery_index USING btree (is_featured, occurrence_date);


--
-- TOC entry 5309 (class 1259 OID 16718)
-- Name: idx_discovery_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_discovery_location ON public.event_discovery_index USING btree (country_code, state_region, city);


--
-- TOC entry 5310 (class 1259 OID 16720)
-- Name: idx_discovery_search_document; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_discovery_search_document ON public.event_discovery_index USING gin (search_document);


--
-- TOC entry 5311 (class 1259 OID 16717)
-- Name: idx_discovery_status_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_discovery_status_date ON public.event_discovery_index USING btree (status, occurrence_date);


--
-- TOC entry 5340 (class 1259 OID 16961)
-- Name: idx_event_action_logs_action_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_action_logs_action_type ON public.event_action_logs USING btree (action_type);


--
-- TOC entry 5341 (class 1259 OID 16962)
-- Name: idx_event_action_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_action_logs_created_at ON public.event_action_logs USING btree (created_at DESC);


--
-- TOC entry 5342 (class 1259 OID 16960)
-- Name: idx_event_action_logs_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_action_logs_event_id ON public.event_action_logs USING btree (event_id);


--
-- TOC entry 5408 (class 1259 OID 17587)
-- Name: idx_event_engagement_action_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_engagement_action_type ON public.event_engagement USING btree (action_type);


--
-- TOC entry 5409 (class 1259 OID 17589)
-- Name: idx_event_engagement_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_engagement_created_at ON public.event_engagement USING btree (created_at DESC);


--
-- TOC entry 5410 (class 1259 OID 17586)
-- Name: idx_event_engagement_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_engagement_event_id ON public.event_engagement USING btree (event_id);


--
-- TOC entry 5411 (class 1259 OID 17588)
-- Name: idx_event_engagement_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_engagement_source ON public.event_engagement USING btree (source);


--
-- TOC entry 5350 (class 1259 OID 17034)
-- Name: idx_event_featured_placements_event_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_featured_placements_event_status ON public.event_featured_placements USING btree (event_id, placement_status);


--
-- TOC entry 5351 (class 1259 OID 17030)
-- Name: idx_event_featured_placements_inventory_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_featured_placements_inventory_status ON public.event_featured_placements USING btree (inventory_id, placement_status);


--
-- TOC entry 5320 (class 1259 OID 16779)
-- Name: idx_event_media_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_media_event_id ON public.event_media USING btree (event_id);


--
-- TOC entry 5305 (class 1259 OID 16716)
-- Name: idx_event_occurrences_event_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_occurrences_event_date ON public.event_occurrences USING btree (event_id, occurrence_date);


--
-- TOC entry 5336 (class 1259 OID 16941)
-- Name: idx_event_payments_checkout_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_payments_checkout_session_id ON public.event_payments USING btree (checkout_session_id);


--
-- TOC entry 5337 (class 1259 OID 16940)
-- Name: idx_event_payments_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_payments_event_id ON public.event_payments USING btree (event_id);


--
-- TOC entry 5283 (class 1259 OID 16783)
-- Name: idx_event_schedules_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_schedules_event_id ON public.event_schedules USING btree (event_id);


--
-- TOC entry 5276 (class 1259 OID 16893)
-- Name: idx_event_submissions_org_uuid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_submissions_org_uuid ON public.event_submissions USING btree (org_uuid);


--
-- TOC entry 5277 (class 1259 OID 16942)
-- Name: idx_event_submissions_payment_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_submissions_payment_status ON public.event_submissions USING btree (payment_status);


--
-- TOC entry 5278 (class 1259 OID 16967)
-- Name: idx_event_submissions_pricing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_submissions_pricing ON public.event_submissions USING btree (pricing_total_cents);


--
-- TOC entry 5347 (class 1259 OID 17033)
-- Name: idx_featured_inventory_type_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_featured_inventory_type_dates ON public.featured_placement_inventory USING btree (page_name, placement_type, starts_at_utc, ends_at_utc);


--
-- TOC entry 5327 (class 1259 OID 16892)
-- Name: idx_organization_accounts_contact_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organization_accounts_contact_email ON public.organization_accounts USING btree (contact_email);


--
-- TOC entry 5328 (class 1259 OID 16891)
-- Name: idx_organization_accounts_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organization_accounts_name ON public.organization_accounts USING btree (organization_name);


--
-- TOC entry 5329 (class 1259 OID 16890)
-- Name: idx_organization_accounts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organization_accounts_status ON public.organization_accounts USING btree (status);


--
-- TOC entry 5386 (class 1259 OID 17512)
-- Name: idx_placement_hold_items_product_window_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_placement_hold_items_product_window_status ON public.placement_hold_items USING btree (placement_product_id, window_start_date, window_end_date, status);


--
-- TOC entry 5380 (class 1259 OID 17511)
-- Name: idx_placement_hold_sessions_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_placement_hold_sessions_event_id ON public.placement_hold_sessions USING btree (event_id);


--
-- TOC entry 5381 (class 1259 OID 17510)
-- Name: idx_placement_hold_sessions_status_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_placement_hold_sessions_status_expires_at ON public.placement_hold_sessions USING btree (status, expires_at);


--
-- TOC entry 5370 (class 1259 OID 17509)
-- Name: idx_placement_products_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_placement_products_code ON public.placement_products USING btree (code);


--
-- TOC entry 5371 (class 1259 OID 17508)
-- Name: idx_placement_products_surface_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_placement_products_surface_id ON public.placement_products USING btree (surface_id);


--
-- TOC entry 5356 (class 1259 OID 17226)
-- Name: idx_placement_publications_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_placement_publications_event_id ON public.placement_publications USING btree (event_id);


--
-- TOC entry 5357 (class 1259 OID 17228)
-- Name: idx_placement_publications_placement_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_placement_publications_placement_code ON public.placement_publications USING btree (placement_code);


--
-- TOC entry 5358 (class 1259 OID 17225)
-- Name: idx_placement_publications_product_window; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_placement_publications_product_window ON public.placement_publications USING btree (placement_product_id, window_start_date, window_end_date);


--
-- TOC entry 5359 (class 1259 OID 17227)
-- Name: idx_placement_publications_reservation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_placement_publications_reservation_id ON public.placement_publications USING btree (reservation_id);


--
-- TOC entry 5360 (class 1259 OID 17224)
-- Name: idx_placement_publications_surface_status_window; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_placement_publications_surface_status_window ON public.placement_publications USING btree (surface_id, approval_status, publication_status, window_start_date, window_end_date);


--
-- TOC entry 5390 (class 1259 OID 17515)
-- Name: idx_placement_reservations_checkout_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_placement_reservations_checkout_session ON public.placement_reservations USING btree (stripe_checkout_session_id);


--
-- TOC entry 5391 (class 1259 OID 17514)
-- Name: idx_placement_reservations_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_placement_reservations_event_id ON public.placement_reservations USING btree (event_id);


--
-- TOC entry 5392 (class 1259 OID 17513)
-- Name: idx_placement_reservations_product_window_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_placement_reservations_product_window_status ON public.placement_reservations USING btree (placement_product_id, window_start_date, window_end_date, reservation_status);


--
-- TOC entry 5365 (class 1259 OID 17507)
-- Name: idx_placement_surfaces_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_placement_surfaces_code ON public.placement_surfaces USING btree (code);


--
-- TOC entry 5405 (class 1259 OID 17571)
-- Name: ux_campaign_promo_media_one_active_per_item; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_campaign_promo_media_one_active_per_item ON public.campaign_promo_media USING btree (campaign_item_id) WHERE (is_active = true);


--
-- TOC entry 5389 (class 1259 OID 17457)
-- Name: ux_placement_hold_items_unique_window_per_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_placement_hold_items_unique_window_per_session ON public.placement_hold_items USING btree (hold_session_id, placement_product_id, window_start_date, window_end_date);


--
-- TOC entry 5363 (class 1259 OID 17222)
-- Name: ux_placement_publications_reservation_window; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_placement_publications_reservation_window ON public.placement_publications USING btree (reservation_id, placement_product_id, window_start_date, window_end_date);


--
-- TOC entry 5364 (class 1259 OID 17223)
-- Name: ux_placement_publications_surface_slot_window; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_placement_publications_surface_slot_window ON public.placement_publications USING btree (surface_id, placement_product_id, window_start_date, window_end_date, slot_number) WHERE ((slot_number IS NOT NULL) AND (publication_status = ANY (ARRAY['scheduled'::public.placement_publication_status, 'active'::public.placement_publication_status])));


--
-- TOC entry 5397 (class 1259 OID 17506)
-- Name: ux_placement_reservations_product_window_slot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_placement_reservations_product_window_slot ON public.placement_reservations USING btree (placement_product_id, window_start_date, window_end_date, slot_number) WHERE ((slot_number IS NOT NULL) AND (reservation_status = ANY (ARRAY['reserved'::public.placement_reservation_status, 'active'::public.placement_reservation_status])));


--
-- TOC entry 5458 (class 2620 OID 17572)
-- Name: campaign_promo_media trg_campaign_promo_media_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_campaign_promo_media_updated_at BEFORE UPDATE ON public.campaign_promo_media FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();


--
-- TOC entry 5456 (class 2620 OID 17520)
-- Name: placement_hold_items trg_placement_hold_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_placement_hold_items_updated_at BEFORE UPDATE ON public.placement_hold_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();


--
-- TOC entry 5455 (class 2620 OID 17519)
-- Name: placement_hold_sessions trg_placement_hold_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_placement_hold_sessions_updated_at BEFORE UPDATE ON public.placement_hold_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();


--
-- TOC entry 5454 (class 2620 OID 17518)
-- Name: placement_inventory_rules trg_placement_inventory_rules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_placement_inventory_rules_updated_at BEFORE UPDATE ON public.placement_inventory_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();


--
-- TOC entry 5453 (class 2620 OID 17517)
-- Name: placement_products trg_placement_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_placement_products_updated_at BEFORE UPDATE ON public.placement_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();


--
-- TOC entry 5451 (class 2620 OID 17230)
-- Name: placement_publications trg_placement_publications_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_placement_publications_updated_at BEFORE UPDATE ON public.placement_publications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();


--
-- TOC entry 5457 (class 2620 OID 17521)
-- Name: placement_reservations trg_placement_reservations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_placement_reservations_updated_at BEFORE UPDATE ON public.placement_reservations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();


--
-- TOC entry 5452 (class 2620 OID 17516)
-- Name: placement_surfaces trg_placement_surfaces_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_placement_surfaces_updated_at BEFORE UPDATE ON public.placement_surfaces FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();


--
-- TOC entry 5450 (class 2620 OID 16851)
-- Name: platform_users trg_platform_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_platform_users_updated_at BEFORE UPDATE ON public.platform_users FOR EACH ROW EXECUTE FUNCTION public.set_platform_users_updated_at();


--
-- TOC entry 5439 (class 2606 OID 17068)
-- Name: ad_campaign_items ad_campaign_items_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_campaign_items
    ADD CONSTRAINT ad_campaign_items_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE CASCADE;


--
-- TOC entry 5447 (class 2606 OID 17556)
-- Name: campaign_promo_media campaign_promo_media_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_promo_media
    ADD CONSTRAINT campaign_promo_media_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE CASCADE;


--
-- TOC entry 5448 (class 2606 OID 17561)
-- Name: campaign_promo_media campaign_promo_media_campaign_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_promo_media
    ADD CONSTRAINT campaign_promo_media_campaign_item_id_fkey FOREIGN KEY (campaign_item_id) REFERENCES public.ad_campaign_items(id) ON DELETE CASCADE;


--
-- TOC entry 5428 (class 2606 OID 16657)
-- Name: event_discovery_index event_discovery_index_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_discovery_index
    ADD CONSTRAINT event_discovery_index_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 5429 (class 2606 OID 16662)
-- Name: event_discovery_index event_discovery_index_occurrence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_discovery_index
    ADD CONSTRAINT event_discovery_index_occurrence_id_fkey FOREIGN KEY (occurrence_id) REFERENCES public.event_occurrences(id) ON DELETE CASCADE;


--
-- TOC entry 5437 (class 2606 OID 17011)
-- Name: event_featured_placements event_featured_placements_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_featured_placements
    ADD CONSTRAINT event_featured_placements_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 5438 (class 2606 OID 17016)
-- Name: event_featured_placements event_featured_placements_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_featured_placements
    ADD CONSTRAINT event_featured_placements_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.featured_placement_inventory(id) ON DELETE RESTRICT;


--
-- TOC entry 5423 (class 2606 OID 16543)
-- Name: event_locations event_locations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_locations
    ADD CONSTRAINT event_locations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 5434 (class 2606 OID 16774)
-- Name: event_media event_media_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_media
    ADD CONSTRAINT event_media_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 5427 (class 2606 OID 16630)
-- Name: event_occurrences event_occurrences_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_occurrences
    ADD CONSTRAINT event_occurrences_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 5436 (class 2606 OID 16933)
-- Name: event_payments event_payments_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_payments
    ADD CONSTRAINT event_payments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 5430 (class 2606 OID 16686)
-- Name: event_review_actions event_review_actions_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_review_actions
    ADD CONSTRAINT event_review_actions_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES public.event_users(id) ON DELETE RESTRICT;


--
-- TOC entry 5431 (class 2606 OID 16681)
-- Name: event_review_actions event_review_actions_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_review_actions
    ADD CONSTRAINT event_review_actions_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 5422 (class 2606 OID 16519)
-- Name: event_schedules event_schedules_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_schedules
    ADD CONSTRAINT event_schedules_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 5424 (class 2606 OID 16564)
-- Name: event_sponsors event_sponsors_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_sponsors
    ADD CONSTRAINT event_sponsors_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 5426 (class 2606 OID 16604)
-- Name: event_status_history event_status_history_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_status_history
    ADD CONSTRAINT event_status_history_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 5435 (class 2606 OID 16808)
-- Name: event_submission_media event_submission_media_event_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_submission_media
    ADD CONSTRAINT event_submission_media_event_submission_id_fkey FOREIGN KEY (event_submission_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 5419 (class 2606 OID 16492)
-- Name: event_submissions event_submissions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_submissions
    ADD CONSTRAINT event_submissions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.event_categories(id);


--
-- TOC entry 5420 (class 2606 OID 17025)
-- Name: event_submissions event_submissions_featured_placement_inventory_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_submissions
    ADD CONSTRAINT event_submissions_featured_placement_inventory_fk FOREIGN KEY (featured_placement_inventory_id) REFERENCES public.featured_placement_inventory(id) ON DELETE SET NULL;


--
-- TOC entry 5421 (class 2606 OID 16487)
-- Name: event_submissions event_submissions_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_submissions
    ADD CONSTRAINT event_submissions_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.event_users(id) ON DELETE SET NULL;


--
-- TOC entry 5425 (class 2606 OID 16586)
-- Name: event_verifications event_verifications_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_verifications
    ADD CONSTRAINT event_verifications_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 5432 (class 2606 OID 16711)
-- Name: featured_events featured_events_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.event_users(id) ON DELETE SET NULL;


--
-- TOC entry 5433 (class 2606 OID 16706)
-- Name: featured_events featured_events_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.featured_events
    ADD CONSTRAINT featured_events_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- TOC entry 5442 (class 2606 OID 17452)
-- Name: placement_hold_items fk_placement_hold_items_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_hold_items
    ADD CONSTRAINT fk_placement_hold_items_product FOREIGN KEY (placement_product_id) REFERENCES public.placement_products(id) ON DELETE RESTRICT;


--
-- TOC entry 5443 (class 2606 OID 17447)
-- Name: placement_hold_items fk_placement_hold_items_session; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_hold_items
    ADD CONSTRAINT fk_placement_hold_items_session FOREIGN KEY (hold_session_id) REFERENCES public.placement_hold_sessions(id) ON DELETE CASCADE;


--
-- TOC entry 5441 (class 2606 OID 17396)
-- Name: placement_inventory_rules fk_placement_inventory_rules_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_inventory_rules
    ADD CONSTRAINT fk_placement_inventory_rules_product FOREIGN KEY (placement_product_id) REFERENCES public.placement_products(id) ON DELETE CASCADE;


--
-- TOC entry 5440 (class 2606 OID 17364)
-- Name: placement_products fk_placement_products_surface; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_products
    ADD CONSTRAINT fk_placement_products_surface FOREIGN KEY (surface_id) REFERENCES public.placement_surfaces(id) ON DELETE RESTRICT;


--
-- TOC entry 5444 (class 2606 OID 17496)
-- Name: placement_reservations fk_placement_reservations_hold_item; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_reservations
    ADD CONSTRAINT fk_placement_reservations_hold_item FOREIGN KEY (hold_item_id) REFERENCES public.placement_hold_items(id) ON DELETE SET NULL;


--
-- TOC entry 5445 (class 2606 OID 17491)
-- Name: placement_reservations fk_placement_reservations_hold_session; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_reservations
    ADD CONSTRAINT fk_placement_reservations_hold_session FOREIGN KEY (hold_session_id) REFERENCES public.placement_hold_sessions(id) ON DELETE SET NULL;


--
-- TOC entry 5446 (class 2606 OID 17501)
-- Name: placement_reservations fk_placement_reservations_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.placement_reservations
    ADD CONSTRAINT fk_placement_reservations_product FOREIGN KEY (placement_product_id) REFERENCES public.placement_products(id) ON DELETE RESTRICT;


--
-- TOC entry 5418 (class 2606 OID 16857)
-- Name: event_users fk_users_created_by; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_users
    ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES public.event_users(id) ON DELETE SET NULL;


--
-- TOC entry 5449 (class 2606 OID 17620)
-- Name: user_notification_preferences user_notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.platform_users(id) ON DELETE CASCADE;


-- Completed on 2026-05-13 14:09:37

--
-- PostgreSQL database dump complete
--

\unrestrict qlQ2KzanqDWxBEzSZ4A37eMyEI1ckfmgJr9bfPKOxqhjsUSse6ZArdqH6DiO9Bs

