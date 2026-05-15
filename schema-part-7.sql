
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

