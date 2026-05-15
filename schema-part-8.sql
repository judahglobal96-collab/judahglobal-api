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

