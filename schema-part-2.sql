


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
