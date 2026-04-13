/**
 * Slack Integration Service
 * 
 * Sends meeting transcription summaries to Slack with:
 * - Meeting completion notifications
 * - Transcript summaries and key points
 * - Action items with assignees
 * - Key decisions
 * - Support for both webhook and OAuth flows
 */

export interface SlackConfig {
  webhookUrl?: string; // For simple webhook-based integration
  accessToken?: string; // For OAuth-based integration
  channelId?: string; // Channel to post messages to
  botName?: string; // Custom bot name
  enabled: boolean;
}

export interface SlackMessage {
  channel?: string;
  username?: string;
  icon_emoji?: string;
  blocks: SlackBlock[];
}

export interface SlackBlock {
  type: 'section' | 'divider' | 'header' | 'image' | 'context' | 'actions';
  text?: {
    type: 'mrkdwn' | 'plain_text';
    text: string;
    emoji?: boolean;
  };
  block_id?: string;
  fields?: Array<{
    type: 'mrkdwn' | 'plain_text';
    text: string;
  }>;
  image_url?: string;
  alt_text?: string;
  elements?: any[];
}

export interface MeetingSummary {
  title: string;
  duration: string;
  attendees?: string[];
  summary: string;
  actionItems?: Array<{
    item: string;
    assignee: string;
  }>;
  keyDecisions?: Array<{
    decision: string;
    rationale?: string;
  }>;
  transcriptUrl?: string;
  recordedAt: string;
  meetingUrl?: string;
}

class SlackService {
  private config: SlackConfig = {
    enabled: false,
  };

  /**
   * Initialize Slack integration with webhook
   */
  initWebhook(webhookUrl: string, channelId?: string): void {
    this.config = {
      webhookUrl,
      channelId,
      enabled: true,
      botName: 'AudioMax Meeting Bot',
    };
    localStorage.setItem('slackConfig', JSON.stringify(this.config));
  }

  /**
   * Initialize Slack integration with OAuth
   */
  initOAuth(accessToken: string, channelId?: string): void {
    this.config = {
      accessToken,
      channelId,
      enabled: true,
      botName: 'AudioMax Meeting Bot',
    };
    localStorage.setItem('slackConfig', JSON.stringify(this.config));
  }

  /**
   * Load configuration from localStorage
   */
  loadConfig(): void {
    const stored = localStorage.getItem('slackConfig');
    if (stored) {
      this.config = JSON.parse(stored);
    }
  }

  /**
   * Send meeting summary to Slack
   */
  async sendMeetingSummary(summary: MeetingSummary): Promise<boolean> {
    if (!this.config.enabled || (!this.config.webhookUrl && !this.config.accessToken)) {
      console.warn('Slack integration not configured');
      return false;
    }

    try {
      const message = this.buildMeetingSummaryMessage(summary);

      if (this.config.webhookUrl) {
        return await this.sendViaWebhook(message);
      } else if (this.config.accessToken) {
        return await this.sendViaOAuth(message);
      }
    } catch (error) {
      console.error('Error sending Slack message:', error);
    }

    return false;
  }

  /**
   * Send simple notification to Slack
   */
  async sendNotification(
    title: string,
    message: string,
    channelOverride?: string,
  ): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      const slackMessage: SlackMessage = {
        username: this.config.botName,
        icon_emoji: ':microphone:',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: title,
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message,
            },
          },
        ],
      };

      if (channelOverride) {
        slackMessage.channel = channelOverride;
      } else if (this.config.channelId) {
        slackMessage.channel = this.config.channelId;
      }

      if (this.config.webhookUrl) {
        return await this.sendViaWebhook(slackMessage);
      } else if (this.config.accessToken) {
        return await this.sendViaOAuth(slackMessage);
      }
    } catch (error) {
      console.error('Error sending Slack notification:', error);
    }

    return false;
  }

  /**
   * Send action items notification
   */
  async sendActionItems(
    meetingTitle: string,
    actionItems: Array<{ item: string; assignee: string }>,
  ): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      const actionItemFields = actionItems.map(item => ({
        type: 'mrkdwn' as const,
        text: `*${item.assignee}*\n${item.item}`,
      }));

      const slackMessage: SlackMessage = {
        username: this.config.botName,
        icon_emoji: ':clipboard:',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `📋 Action Items: ${meetingTitle}`,
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: actionItemFields,
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `From AudioMax • Posted at ${new Date().toLocaleTimeString()}`,
              },
            ],
          },
        ],
      };

      if (this.config.webhookUrl) {
        return await this.sendViaWebhook(slackMessage);
      } else if (this.config.accessToken) {
        return await this.sendViaOAuth(slackMessage);
      }
    } catch (error) {
      console.error('Error sending action items:', error);
    }

    return false;
  }

  /**
   * Build message with meeting summary, decisions, and action items
   */
  private buildMeetingSummaryMessage(summary: MeetingSummary): SlackMessage {
    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🎙️ ${summary.title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Duration*\n${summary.duration}`,
          },
          {
            type: 'mrkdwn',
            text: `*Recorded*\n${new Date(summary.recordedAt).toLocaleString()}`,
          },
          ...(summary.attendees && summary.attendees.length > 0
            ? [
                {
                  type: 'mrkdwn' as const,
                  text: `*Attendees*\n${summary.attendees.join(', ')}`,
                },
              ]
            : []),
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Summary*\n${summary.summary}`,
        },
      },
    ];

    // Add key decisions if available
    if (summary.keyDecisions && summary.keyDecisions.length > 0) {
      blocks.push(
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Key Decisions*',
          },
        },
      );

      // Add each decision
      summary.keyDecisions.forEach((decision, index) => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${index + 1}. *${decision.decision}*${decision.rationale ? `\n_${decision.rationale}_` : ''}`,
          },
        });
      });
    }

    // Add action items if available
    if (summary.actionItems && summary.actionItems.length > 0) {
      blocks.push(
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Action Items*',
          },
        },
      );

      const actionItemFields = summary.actionItems.map(item => ({
        type: 'mrkdwn' as const,
        text: `☐ *${item.assignee}*\n${item.item}`,
      }));

      blocks.push({
        type: 'section',
        fields: actionItemFields,
      });
    }

    // Add transcript link and footer
    if (summary.transcriptUrl) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<${summary.transcriptUrl}|View Full Transcript>`,
        },
      });
    }

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📊 From AudioMax • Posted at ${new Date().toLocaleTimeString()}`,
        },
      ],
    });

    return {
      username: this.config.botName,
      icon_emoji: ':microphone:',
      channel: this.config.channelId,
      blocks,
    };
  }

  /**
   * Send message via webhook
   */
  private async sendViaWebhook(message: SlackMessage): Promise<boolean> {
    if (!this.config.webhookUrl) {
      console.error('No webhook URL configured');
      return false;
    }

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending via webhook:', error);
      return false;
    }
  }

  /**
   * Send message via OAuth (using Slack API)
   */
  private async sendViaOAuth(message: SlackMessage): Promise<boolean> {
    if (!this.config.accessToken) {
      console.error('No access token configured');
      return false;
    }

    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify({
          channel: message.channel || this.config.channelId,
          blocks: message.blocks,
          username: message.username,
          icon_emoji: message.icon_emoji,
        }),
      });

      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error('Error sending via OAuth:', error);
      return false;
    }
  }

  /**
   * Test Slack connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    const testMessage: SlackMessage = {
      username: this.config.botName,
      icon_emoji: ':test_tube:',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: '✅ AudioMax Slack integration is working!',
            emoji: true,
          },
        },
      ],
    };

    return await this.sendMeetingSummary({
      title: 'Test Message from AudioMax',
      duration: '0:00',
      summary: 'This is a test message to verify Slack integration is working correctly.',
      recordedAt: new Date().toISOString(),
    });
  }

  /**
   * Get current configuration status
   */
  getStatus(): {
    enabled: boolean;
    configType: 'webhook' | 'oauth' | 'none';
    channelId?: string;
  } {
    return {
      enabled: this.config.enabled,
      configType: this.config.webhookUrl
        ? 'webhook'
        : this.config.accessToken
          ? 'oauth'
          : 'none',
      channelId: this.config.channelId,
    };
  }

  /**
   * Clear Slack configuration
   */
  clearConfig(): void {
    this.config = { enabled: false };
    localStorage.removeItem('slackConfig');
  }
}

// Export singleton instance
export const slackService = new SlackService();
