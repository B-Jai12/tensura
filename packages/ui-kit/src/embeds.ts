import { EmbedBuilder } from "discord.js";
import { BRAND, PALETTE } from "./theme.js";

export type EmbedTone = "default" | "success" | "warning" | "danger" | "info";

const TONE_COLOR: Record<EmbedTone, number> = {
  default: PALETTE.blossomPink,
  success: PALETTE.success,
  warning: PALETTE.warning,
  danger: PALETTE.danger,
  info: PALETTE.info,
};

export interface BaseEmbedOptions {
  title?: string;
  description?: string;
  tone?: EmbedTone;
}

/**
 * Every command builds embeds through this helper rather than
 * `new EmbedBuilder()` directly — it's what guarantees the footer,
 * color palette, and tone conventions can't drift command by command.
 * If the aesthetic ever changes, it changes here once.
 */
export function baseEmbed(options: BaseEmbedOptions = {}): EmbedBuilder {
  const { title, description, tone = "default" } = options;

  const embed = new EmbedBuilder().setColor(TONE_COLOR[tone]).setFooter({ text: BRAND.footerText });

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);

  return embed;
}
