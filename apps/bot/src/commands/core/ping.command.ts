import { SlashCommandBuilder } from "discord.js";
import { baseEmbed, EMOJI } from "@tensura/ui-kit";
import type { CommandDefinition } from "../../registry/command.types.js";

const command: CommandDefinition = {
  module: "core",
  cooldownSeconds: 3,
  data: new SlashCommandBuilder().setName("ping").setDescription("Check that Tensura is awake and warm."),
  async execute(interaction) {
    const sent = await interaction.reply({
      embeds: [baseEmbed({ description: `${EMOJI.sparkle} Warming up the kettle...` })],
      fetchReply: true,
    });

    const latencyMs = sent.createdTimestamp - interaction.createdTimestamp;
    const wsMs = interaction.client.ws.ping;

    await interaction.editReply({
      embeds: [
        baseEmbed({
          title: `${EMOJI.cup} Pong!`,
          description: `Round-trip: **${latencyMs}ms**\nGateway: **${wsMs}ms**`,
          tone: "success",
        }),
      ],
    });
  },
};

export default command;
