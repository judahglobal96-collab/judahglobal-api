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
