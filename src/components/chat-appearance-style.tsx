import { normalizeChatAppearance, type ChatAppearance } from "@/lib/chat-appearance";

export function ChatAppearanceStyle({ config, scope = ".classic-chat" }: { config: ChatAppearance; scope?: ".classic-chat" | ".chat-editor-preview" }) {
  const c = normalizeChatAppearance(config);
  return <style>{`${scope}{--chat-paper:${c.paper};--chat-ink:${c.ink};--chat-steel:${c.steel};--chat-edge:${c.edge};--chat-name:${c.name};--chat-font:${c.fontSize}px;--chat-avatar:${c.avatarSize}px;--chat-icon:${c.iconSize}px;--chat-radius:${c.radius}px}
${scope} .classic-chat-frame,${scope} .classic-chat-messages{border-radius:var(--chat-radius)}
${scope} .classic-chat-body{font-size:var(--chat-font)}
${scope} .classic-chat-avatar{width:var(--chat-avatar);height:var(--chat-avatar)}
${scope} .classic-chat-actions svg{width:var(--chat-icon);height:var(--chat-icon)}
${scope} .classic-chat-messages{color:var(--chat-ink)}
${scope} .classic-chat-message-meta b{color:var(--chat-name)}
${!c.showRoses ? `${scope} .classic-chat-masthead img{visibility:hidden}` : ""}
${!c.showAvatars ? `${scope} .classic-chat-avatar{display:none}` : ""}
${!c.showSidebar ? `${scope} .classic-chat-sidebar{display:none}${scope} .classic-chat-workspace{grid-template-columns:minmax(0,1fr)!important}` : ""}
@media(min-width:641px){${scope}:not(.classic-chat-embedded .classic-chat) .classic-chat-workspace{height:${c.height}px;${c.showSidebar ? `grid-template-columns:minmax(0,1fr) ${c.sidebarWidth}px;` : ""}}}
@media(max-width:640px){${scope} .classic-chat-workspace{height:${c.height}px}${scope} .classic-chat-body{font-size:min(var(--chat-font),18px)}${scope} .classic-chat-avatar{width:min(var(--chat-avatar),34px);height:min(var(--chat-avatar),34px)}}`}</style>;
}