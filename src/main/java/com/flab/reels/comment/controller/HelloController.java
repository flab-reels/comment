package com.flab.reels.comment.controller;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping
    public String welcome() {
        return "Greetings New Pipeline!";
    }

    @GetMapping("/Jose")
    public String hello(@PathVariable String name) {
        return "What's up" + name;
    }

    @GetMapping("/Aneesah")
    public String hello() {
        return "I love you :3";
    }
}
