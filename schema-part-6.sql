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

