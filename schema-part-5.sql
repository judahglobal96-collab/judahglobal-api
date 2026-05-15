

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
