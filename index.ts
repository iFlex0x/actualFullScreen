/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { ChannelRTCStore, FluxDispatcher, SelectedChannelStore } from "@webpack/common";

const openBefore = new Map<string, boolean>();

function setOpen(channelId: string, open: boolean) {
    FluxDispatcher.dispatch({
        type: "CHANNEL_RTC_UPDATE_PARTICIPANTS_OPEN",
        channelId,
        participantsOpen: open
    });
}

function hide(channelId: string) {
    if (openBefore.has(channelId)) return;

    const wasOpen = ChannelRTCStore.getParticipantsOpen(channelId);
    openBefore.set(channelId, wasOpen);
    if (wasOpen) setOpen(channelId, false);
}

function restore(channelId: string) {
    if (!openBefore.has(channelId)) return;

    const wasOpen = openBefore.get(channelId)!;
    openBefore.delete(channelId);

    if (wasOpen && !ChannelRTCStore.getParticipantsOpen(channelId)) setOpen(channelId, true);
}

export default definePlugin({
    name: "ActualFullScreen",
    description: "Hides voice members when a stream goes fullscreen",
    authors: [{ name: "iFlex0x", id: 1007939118925361212n }],

    start() {
        const channelId = SelectedChannelStore.getVoiceChannelId();
        if (channelId && ChannelRTCStore.getLayout(channelId, "APP") === "full-screen") hide(channelId);
    },

    stop() {
        for (const channelId of [...openBefore.keys()]) restore(channelId);
    },

    flux: {
        CALL_DELETE({ channelId }: { channelId: string; }) {
            restore(channelId);
        },

        CHANNEL_RTC_UPDATE_LAYOUT({ channelId, layout, appContext }: {
            channelId: string;
            layout: string;
            appContext?: string;
        }) {
            if (appContext && appContext !== "APP") return;

            if (layout === "full-screen") hide(channelId);
            else restore(channelId);
        }
    }
});
