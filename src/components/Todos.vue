<script setup lang="ts">
import '@/assets/main.css';
import { onMounted, ref } from 'vue';
import type { Schema } from '../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';

const client = generateClient<Schema>();

// create a reactive reference to the array of todos
const todos = ref<Array<Schema['Todo']["type"]>>([]);
const helloMessage = ref('Ready');
const prompt = ref('Please write a haiku about coding.')

function listTodos() {
  client.models.Todo.observeQuery().subscribe({
    next: ({ items, isSynced }) => {
      todos.value = items
     },
  }); 
}

function createTodo() {
  client.models.Todo.create({
    content: window.prompt("Todo content")
  }).then(() => {
    // After creating a new todo, update the list of todos
    listTodos();
  });
}

function callFunction() {
  
    client.queries.sayHello({
      name: prompt.value,
    }).then((result) => {
      console.log(result);
      let prompt_result: string = result.data?.toString() || ''; 
      let parsedResult = JSON.parse(prompt_result)
      console.log(parsedResult);
      console.log(parsedResult["body"]);
      let prompt_reply = parsedResult["body"]["prompt_reply"];
      console.log('prompt_reply')
      console.log(prompt_reply)
      helloMessage.value = prompt_reply;
      // Screen will update automatically due to reactivity
    })

  }

  // Async function to be able to use await. Otherwise, use the then block. 
  function callBedrock() {
    client.queries.generateHaiku({
      prompt: prompt.value,
    }).then((result) => {
      console.log(result);
      let prompt_result: string = result.data?.toString() || ''; 
      helloMessage.value = prompt_result;
    })
    
  }
    
// fetch todos when the component is mounted
onMounted(() => {
  listTodos();
});

</script>

<template>
  <main>
    <h1>Prompt</h1>
    <textarea v-model="prompt" placeholder="add multiple lines" rows=4
    cols=40></textarea>
   
    <button @click="callFunction()">Query Google Gemini</button>
    <br />
    <button @click="callBedrock()">Query Bedrock Claude</button>
    <pre>{{ helloMessage }}</pre>
    <br />
    <button @click="createTodo">+ new</button>
    <ul>
      <li 
        v-for="todo in todos" 
        :key="todo.id">
        {{ todo.content }}
      </li>
    </ul>
    <div>
      🥳 Try querying the LLM.
      <br />
    </div>
  </main>
</template>
