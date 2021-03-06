<template>
  <div class="mb-2 mt-2">
    <b-popover :target="`emojis_${commentId}`" triggers="hover" placement="bottom">
      <b-button v-for="(emoji, index) in emojiArray" v-bind:key="index"
                v-on:click="addEmoji(index)"
                variant="outline" size="sm">
        {{emoji}}
      </b-button>
    </b-popover>

    <div class="comment-box">
      <b-container fluid>
        <b-row>
          <b-col sm="12">
            <!-- <b-form-textarea
              class="textarea"
              :class="`${!wrapIcons ? 'textarea_long' : 'textarea_short'}`"
              rows="1" max-rows="8"
              :placeholder="$t('comment.write-comment-placeholder')"
              v-model="text"
            >
            </b-form-textarea> -->

            <editor v-if="isShow"
              class="textarea"
              :class="`${!wrapIcons ? 'textarea_long' : 'textarea_short'}`"
            ref="editor" :config="config" :initialized="onInitialized"/>

          </b-col>
        </b-row>
      </b-container>

      <div class="icons" :class="`${wrapIcons ? 'icons_long' : 'icons_short'}`">
        <b-button :id="`emojis_${commentId}`" class="mt-2" variant="outline" size="sm">
          <BIconEmojiSunglasses></BIconEmojiSunglasses>
        </b-button>
<!--
TODO: tato funkce vyzaduje widget, ktery rozumi HTML znackam
        <b-button v-if="parent" class="mt-2" variant="outline" size="sm">
          <b-icon icon="chat-quote"></b-icon>
        </b-button>
-->
        <b-button v-if="parent" @click="dismiss" class="mt-2" variant="outline" size="sm">
          <BIconXCircle></BIconXCircle>
        </b-button>
      </div>
    </div>

    <b-alert v-model="error" variant="danger" dismissible>
      {{ $t('generic.internal-error') }}
    </b-alert>
    <Button :disabled="sending" class="mt-2" size="sm" :value="$t('comment.send-button')" @clicked="send"/>
  </div>
</template>

<script>
import { BIconEmojiSunglasses, BIconXCircle } from 'bootstrap-vue';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Embed from '@editorjs/embed';
import Table from '@editorjs/table';
import Quote from '@editorjs/quote';
import Delimiter from '@editorjs/delimiter';
import Button from '@/components/atoms/Button.vue';

export default {
  name: 'CommentForm',
  props: {
    itemId: String,
    parent: String,
    commentId: String,
    isShow: Boolean,
  },
  components: {
    Button, BIconEmojiSunglasses, BIconXCircle,
  },
  data() {
    return {
      text: '',
      sending: null,
      error: null,
      emojiArray: ['\u{1F600}', '\u{1F603}', '\u{1F601}', '\u{1F606}',
        '\u{1F60B}', '\u{1F61B}', '\u{1F61C}', '\u{1F92D}', '\u{1F92B}',
        '\u{1F910}', '\u{1F928}', '\u{1F644}', '\u{1F614}', '\u{1F634}',
        '\u{1F637}', '\u{1F975}', '\u{1F60E}', '\u{2639}', '\u{1F633}',
        '\u{1F62D}', '\u{1F629}', '\u{1F621}', '\u{1F620}', '\u{1F47F}'],

      config: {
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              placeholder: this.$t('blog.form.h-placeholder'),
              levels: [1, 2, 3],
              defaultLevel: 3,
            },
          },
          list: {
            class: List,
            inlineToolbar: true,
          },
          paragraph: {
            class: Paragraph,
          },
          embed: {
            class: Embed,
            inlineToolbar: true,
            config: {
              services: {
                youtube: true,
                instagram: true,
                twitter: true,
                gfycat: true,
              },
            },
          },
          delimiter: Delimiter,
          table: {
            class: Table,
            inlineToolbar: true,
            config: {
              rows: 2,
              cols: 3,
            },
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
            shortcut: 'CMD+SHIFT+O',
            config: {
              quotePlaceholder: this.$t('blog.form.q-placeholder'),
            },
          },
        },
        placeholder: this.$t('blog.form.p-placeholder'),
        data: {},
        i18n: {
          messages: {
            ui: {
              blockTunes: {
                toggler: {
                  'Click to tune': this.$t('blog.form.click-to-tune'),
                  'or drag to move': this.$t('blog.form.or-drag-to-move'),
                },
              },
              inlineToolbar: {
                converter: {
                  'Convert to': this.$t('blog.form.convert-to'),
                },
              },
              toolbar: {
                toolbox: {
                  Add: this.$t('blog.form.add'),
                },
              },
            },
            toolNames: {
              Text: this.$t('blog.form.text'),
              Heading: this.$t('blog.form.heading'),
              List: this.$t('blog.form.list'),
              Quote: this.$t('blog.form.quote'),
              Delimiter: this.$t('blog.form.delimiter'),
              Table: this.$t('blog.form.table'),
              Image: this.$t('blog.form.table'),
              Bold: this.$t('blog.form.bold'),
              Italic: this.$t('blog.form.italic'),
              InlineCode: this.$t('blog.form.inlineCode'),
            },
            tools: {
              warning: {
                Title: this.$t('blog.form.title'),
                Message: this.$t('blog.form.message'),
              },
              link: {
                'Add a link': this.$t('blog.form.add-link'),
              },
              stub: {
                'The block can not be displayed correctly.': this.$t('blog.form.display-incorrect'),
              },
            },
            blockTunes: {
              delete: {
                Delete: this.$t('blog.form.delete'),
              },
              moveUp: {
                'Move up': this.$t('blog.form.move-up'),
              },
              moveDown: {
                'Move down': this.$t('blog.form.move-down'),
              },
            },
          },
        },
      },
    };
  },
  // data: () => ({

  // }),
  computed: {
    wrapIcons() {
      return this.text.length > 140;
    },
  },
  methods: {
    dismiss() {
      this.$emit('dismiss');
    },
    async send() {
      this.error = false;
      this.sending = true;

      const payload = {
        itemId: this.itemId,
        text: this.text,
      };

      if (this.parent) {
        payload.parent = this.parent;
      }

      try {
        await this.$store.dispatch('ADD_COMMENT', payload);
        this.text = '';
        this.$emit('dismiss');
      } catch (e) {
        this.$log.error(e);
        this.error = true;
      }
      this.sending = false;
    },
    addEmoji(idx) {
      this.text += this.emojiArray[idx];
    },
    onInitialized(editor) {
      this.$log.debug(editor);
    },
  },
};
</script>

<style>
  #vue-editor-js {
    border: 1px solid #ced4da
  }
  .comment-box .codex-editor {
    height: 150px;
  }

  .comment-box .codex-editor__redactor {
    padding-bottom: 100px
  }
  .comment-box .comment-box {
    position: relative;
    width: 100%;
  }

  .comment-box .textarea {
    /* height: 40px; */
    overflow-y: hidden;
  }

  .comment-box .textarea_short {
    padding: 13px 50px 34px 32px;
  }

  .comment-box .textarea_long {
    padding: 0px 30px 5px 30px;
  }

  .comment-box .icons {
    position: relative;
    text-align: right;
    width: 143px;
    float: right;
  }

  .comment-box .icons_short {
    /* top: -36px; */
    right: 40px;
  }

  .comment-box .icons_long {
    top: -45px;
    right: 40px; /*68*/
  }
</style>
