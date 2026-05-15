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



