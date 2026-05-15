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
